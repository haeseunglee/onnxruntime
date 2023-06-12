# automatically generated by the FlatBuffers compiler, do not modify

# namespace: fbs

import flatbuffers
from flatbuffers.compat import import_numpy
np = import_numpy()

class PropertyBag(object):
    __slots__ = ['_tab']

    @classmethod
    def GetRootAsPropertyBag(cls, buf, offset):
        n = flatbuffers.encode.Get(flatbuffers.packer.uoffset, buf, offset)
        x = PropertyBag()
        x.Init(buf, n + offset)
        return x

    @classmethod
    def PropertyBagBufferHasIdentifier(cls, buf, offset, size_prefixed=False):
        return flatbuffers.util.BufferHasIdentifier(buf, offset, b"\x4F\x52\x54\x4D", size_prefixed=size_prefixed)

    # PropertyBag
    def Init(self, buf, pos):
        self._tab = flatbuffers.table.Table(buf, pos)

    # PropertyBag
    def Ints(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            from ort_flatbuffers_py.fbs.IntProperty import IntProperty
            obj = IntProperty()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # PropertyBag
    def IntsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # PropertyBag
    def IntsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(4))
        return o == 0

    # PropertyBag
    def Floats(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            from ort_flatbuffers_py.fbs.FloatProperty import FloatProperty
            obj = FloatProperty()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # PropertyBag
    def FloatsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # PropertyBag
    def FloatsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(6))
        return o == 0

    # PropertyBag
    def Strings(self, j):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            x = self._tab.Vector(o)
            x += flatbuffers.number_types.UOffsetTFlags.py_type(j) * 4
            x = self._tab.Indirect(x)
            from ort_flatbuffers_py.fbs.StringProperty import StringProperty
            obj = StringProperty()
            obj.Init(self._tab.Bytes, x)
            return obj
        return None

    # PropertyBag
    def StringsLength(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        if o != 0:
            return self._tab.VectorLen(o)
        return 0

    # PropertyBag
    def StringsIsNone(self):
        o = flatbuffers.number_types.UOffsetTFlags.py_type(self._tab.Offset(8))
        return o == 0

def PropertyBagStart(builder): builder.StartObject(3)
def PropertyBagAddInts(builder, ints): builder.PrependUOffsetTRelativeSlot(0, flatbuffers.number_types.UOffsetTFlags.py_type(ints), 0)
def PropertyBagStartIntsVector(builder, numElems): return builder.StartVector(4, numElems, 4)
def PropertyBagAddFloats(builder, floats): builder.PrependUOffsetTRelativeSlot(1, flatbuffers.number_types.UOffsetTFlags.py_type(floats), 0)
def PropertyBagStartFloatsVector(builder, numElems): return builder.StartVector(4, numElems, 4)
def PropertyBagAddStrings(builder, strings): builder.PrependUOffsetTRelativeSlot(2, flatbuffers.number_types.UOffsetTFlags.py_type(strings), 0)
def PropertyBagStartStringsVector(builder, numElems): return builder.StartVector(4, numElems, 4)
def PropertyBagEnd(builder): return builder.EndObject()
