// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {DataType} from '../../../wasm-common';
import {TensorView} from '../../tensor';
import {ShapeUtil} from '../../util';
import {AttributeWithCacheKey, createAttributeWithCacheKey} from '../attribute-with-cache-key';
import {ComputeContext, GpuDataType, ProgramInfo, ProgramInfoLoader, ProgramMetadata} from '../types';

import {IndicesHelper, inputVariable, outputVariable, ShaderHelper} from './common';

const validateInputs = (inputs: readonly TensorView[]): void => {
  if (!inputs || inputs.length === 0 || inputs.length > 2) {
    throw new Error('Reduce op requires 1 or 2 inputs.');
  }

  if (inputs.length === 2 && inputs[1].dims.length !== 1) {
    throw new Error('Invalid axes input dims.');
  }

  if (inputs[0].dataType !== DataType.float) {
    throw new Error('Invalid input type.');
  }
};

export interface ReduceAttributes extends AttributeWithCacheKey {
  keepDims: boolean;
  noopWithEmptyAxes: boolean;
  axes: number[];
}

/**
 * ReduceOp is a function that takes a list of inputs and a list of axes and
 *
 * @param inputs - xxx
 * @param axes - xxx
 */
export type ReduceOp = (input: IndicesHelper, axes: number[]) => string[];

const noOp: ReduceOp = (): string[] => ['', '', 'var value = _A[inputIdx];', ''];
export const createReduceProgramInfo =
    (metadata: ProgramMetadata, inputs: readonly TensorView[], reduceOp: ReduceOp, axesInput: number[],
     outputDataType: DataType, keepDims = false, noopWithEmptyAxes = false): ProgramInfo => {
      const outputShape: number[] = [];
      const inputShape = inputs[0].dims;

      const idxCopy: string[] = [];  // copy output indexes to input indexes

      const axes = ShapeUtil.normalizeAxes(axesInput, inputs[0].dims.length);
      const input = inputVariable('_A', inputs[0].dataType, inputShape);
      const ops = reduceOp(input, axes);
      const inputIdxAssignment = `inputIdx = ${input.indicesToOffset('inputIndices')};`;
      const initInputIdxLet = `let ${inputIdxAssignment};`;
      const initInputIdxVar = `var ${inputIdxAssignment};`;
      const initInputIdx = (ops[1] === '') ? '' : initInputIdxVar;
      let reduceOps = ((ops[1] === '') ? initInputIdxLet : inputIdxAssignment) + '\n' + ops[2];
      const reduceOnAllAxes = !noopWithEmptyAxes && axes.length === 0;
      inputShape.forEach((d, i) => {
        if (reduceOnAllAxes || axes.indexOf(i) >= 0) {
          if (keepDims) {
            outputShape.push(1);
          }  // else { // skip this axis}
        } else {
          outputShape.push(d);
        }
      });

      const output = outputVariable('output', outputDataType, outputShape);

      for (let k = 0, l = 0; k < inputs[0].dims.length; k++) {
        // if this axis is reduced
        if (reduceOnAllAxes || axes.indexOf(k) >= 0) {
          if (keepDims) {
            l++;
          }
          // loop over the d-th axis
          reduceOps = `for(var j${k}: u32 = 0; j${k} < ${inputs[0].dims[k]}; j${k}++) {
                ${ops[2].includes('lastIndex') ? `let lastIndex = j${k};` : ''}
                ${input.indicesSet('inputIndices', k, `j${k}`)}
                ${reduceOps}
              }`;
        } else {
          idxCopy.push(`${input.indicesSet('inputIndices', k, output.indicesGet('outputIndices', l))};`);
          l++;
        }
      }

      const outputSize = ShapeUtil.size(outputShape);
      const getShaderSource = (shaderHelper: ShaderHelper) => `
        ${shaderHelper.declareVariables(input, output)}

        ${output.impl('offsetToIndices')}
        ${input.impl('indicesToOffset')}

        ${shaderHelper.mainStart()}
          ${shaderHelper.guardAgainstOutOfBoundsWorkgroupSizes(outputSize)}
          var inputIndices: ${input.type.indices};
          let outputIndices = ${output.offsetToIndices('global_idx')};

          ${idxCopy.join('\n')}
          ${ops[0]}       // init ops for reduce max/min
          ${initInputIdx}
          ${ops[1]}
          ${reduceOps}
          ${ops[3]}
          ${ops.length === 4 ? 'output[global_idx] = value;' : ops.slice(4).join('\n')}
        }`;

      return {
        ...metadata,
        getShaderSource,
        outputs: [{dims: outputShape, dataType: outputDataType, gpuDataType: GpuDataType.default}],
        dispatchGroup: () => ({x: Math.ceil(outputSize / 64 /* workgroup size */)})
      };
    };

const createReduceAttributesFromInputs =
    (inputs: readonly TensorView[], attributes: ReduceAttributes): ReduceAttributes => {
      const axes: number[] = [];
      if (inputs[1].dims[0] > 0) {
        inputs[1].getBigInt64Array().forEach(v => axes.push(Number(v)));
      }
      return createAttributeWithCacheKey(
          {axes, keepDims: attributes.keepDims, noopWithEmptyAxes: attributes.noopWithEmptyAxes});
    };

const createReduceProgramInfoLoader =
    (inputs: readonly TensorView[], name: string, attributes: ReduceAttributes,
     reduceOp: ReduceOp): ProgramInfoLoader => {
      const updatedAttributes: ReduceAttributes =
          inputs.length === 1 ? attributes : createReduceAttributesFromInputs(inputs, attributes);
      const metadata: ProgramMetadata = {
        name,
        inputTypes: [GpuDataType.default],
        cacheHint: updatedAttributes.cacheKey + '_' + inputs[0].dims.map(d => d.toString()).join(',')
      };
      return {
        ...metadata,
        get: () => createReduceProgramInfo(
            metadata, [inputs[0]],
            updatedAttributes.noopWithEmptyAxes && updatedAttributes.axes.length === 0 ? noOp : reduceOp,
            updatedAttributes.axes, inputs[0].dataType, updatedAttributes.keepDims, updatedAttributes.noopWithEmptyAxes)
      };
    };

export const reduceLogSum = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (): string[] => ['var value = 0.0;', '', 'value += _A[inputIdx];', 'value = log(value);'];
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceLogSum', attributes, reduceOp), {inputs: [0]});
};

export const reduceL1 = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (): string[] => ['var value = 0.0;', '', 'value += abs(_A[inputIdx]);', ''];
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceL1', attributes, reduceOp), {inputs: [0]});
};

export const reduceL2 = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (): string[] =>
      ['var t = f32(0); var value = 0.0;', '', 't = _A[inputIdx]; value += (t * t);', 'value = sqrt(value);'];
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceL2', attributes, reduceOp), {inputs: [0]});
};

export const reduceLogSumExp = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp =
      (): string[] => ['var value = 0.0;', '', 'value += exp(_A[inputIdx]);', 'value = log(value);'];
  context.compute(
      createReduceProgramInfoLoader(context.inputs, 'ReduceLogSumExp', attributes, reduceOp), {inputs: [0]});
};

export const reduceMax = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (input: IndicesHelper, axes: number[]): string[] => {
    const idxZero = [];
    for (let k = 0; k < input.shape.length; k++) {
      if (axes.indexOf(k) >= 0 || axes.length === 0) {
        idxZero.push(`inputIndices[${k}] = 0;`);  // first element
      }
    }

    return [`${idxZero.join('\n')}`, 'var value = _A[inputIdx];', 'value = max(value, _A[inputIdx]);', ''];
  };
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceMax', attributes, reduceOp), {inputs: [0]});
};

export const reduceMean = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (input: IndicesHelper, axes: number[]): string[] => {
    let size = 1.0;
    for (let k = 0; k < input.shape.length; k++) {
      if (axes.indexOf(k) >= 0 || axes.length === 0) {
        size *= input.shape[k];
      }
    }

    return [
      'var value = 0.0;', '', 'value += _A[inputIdx];', `value = value / ${size}.;`
    ];  // ensure real number with `.`
  };
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceMean', attributes, reduceOp), {inputs: [0]});
};

export const reduceMin = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (input: IndicesHelper, axes: number[]): string[] => {
    const idxZero = [];
    for (let k = 0; k < input.shape.length; k++) {
      if (axes.indexOf(k) >= 0 || axes.length === 0) {
        idxZero.push(`inputIndices[${k}] = 0;`);  // first element
      }
    }

    return [`${idxZero.join('\n')}`, 'var value = _A[inputIdx];', 'value = min(value, _A[inputIdx]);', ''];
  };
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceMin', attributes, reduceOp), {inputs: [0]});
};

export const reduceProd = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (): string[] => ['var value = 1.0;', '', 'value *= _A[inputIdx];', ''];
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceProd', attributes, reduceOp), {inputs: [0]});
};

export const reduceSum = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp = (): string[] => ['var value = 0.0;', '', 'value += _A[inputIdx];', ''];
  context.compute(createReduceProgramInfoLoader(context.inputs, 'ReduceSum', attributes, reduceOp), {inputs: [0]});
};

export const reduceSumSquare = (context: ComputeContext, attributes: ReduceAttributes): void => {
  validateInputs(context.inputs);
  const reduceOp: ReduceOp =
      (): string[] => ['var t = f32(0); var value = 0.0;', '', 't = _A[inputIdx]; value += t * t;', ''];
  context.compute(
      createReduceProgramInfoLoader(context.inputs, 'ReduceSumSquare', attributes, reduceOp), {inputs: [0]});
};

export const parseReduceAttributes = (attributes: Record<string, unknown>): ReduceAttributes =>
    createAttributeWithCacheKey(attributes as Omit<ReduceAttributes, keyof AttributeWithCacheKey>);
