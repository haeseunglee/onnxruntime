﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#include "pch.h"

#include "LearningModel.h"

#include "TensorFeatureDescriptor.h"

namespace WINMLP {
TensorFeatureDescriptor::TensorFeatureDescriptor(
    const char* name,
    const char* description,
    winml::TensorKind tensor_kind,
    const std::vector<int64_t>& shape,
    std::vector<winrt::hstring>& dimension_names,
    std::vector<winrt::hstring>& dimension_denotations,
    bool is_required,
    bool has_unsupported_image_metadata) : name_(_winml::Strings::HStringFromUTF8(name)),
                                           description_(_winml::Strings::HStringFromUTF8(description)),
                                           tensor_kind_(tensor_kind),
                                           shape_(shape),
                                           dimension_names_(dimension_names),
                                           dimension_denotations_(dimension_denotations),
                                           is_required_(is_required),
                                           has_unsupported_image_metadata_(has_unsupported_image_metadata) {
}

TensorFeatureDescriptor::TensorFeatureDescriptor(
    const char* name,
    const char* description,
    winml::TensorKind tensor_kind,
    const std::vector<int64_t>& shape,
    bool is_required,
    bool has_unsupported_image_metadata) : name_(_winml::Strings::HStringFromUTF8(name)),
                                           description_(_winml::Strings::HStringFromUTF8(description)),
                                           tensor_kind_(tensor_kind),
                                           shape_(shape),
                                           is_required_(is_required),
                                           has_unsupported_image_metadata_(has_unsupported_image_metadata) {
}

winml::TensorKind
TensorFeatureDescriptor::TensorKind() try {
  return tensor_kind_;
}
WINML_CATCH_ALL

wfc::IVectorView<int64_t>
TensorFeatureDescriptor::Shape() try {
  return winrt::single_threaded_vector<int64_t>(
             std::vector<int64_t>(
                 std::begin(shape_),
                 std::end(shape_)))
      .GetView();
}
WINML_CATCH_ALL

wfc::IVectorView<winrt::hstring>
TensorFeatureDescriptor::DimensionNames() try {
  return winrt::single_threaded_vector<winrt::hstring>(
             std::vector<winrt::hstring>(
                 std::begin(dimension_names_),
                 std::end(dimension_names_)))
      .GetView();
}
WINML_CATCH_ALL

wfc::IVectorView<winrt::hstring>
TensorFeatureDescriptor::DimensionDenotations() try {
  return winrt::single_threaded_vector<winrt::hstring>(
             std::vector<winrt::hstring>(
                 std::begin(dimension_denotations_),
                 std::end(dimension_denotations_)))
      .GetView();
}
WINML_CATCH_ALL

winrt::hstring
TensorFeatureDescriptor::Name() try {
  return name_;
}
WINML_CATCH_ALL

winrt::hstring
TensorFeatureDescriptor::Description() try {
  return description_;
}
WINML_CATCH_ALL

winml::LearningModelFeatureKind
TensorFeatureDescriptor::Kind() try {
  return LearningModelFeatureKind::Tensor;
}
WINML_CATCH_ALL

bool TensorFeatureDescriptor::IsRequired() try {
  return is_required_;
}
WINML_CATCH_ALL

bool TensorFeatureDescriptor::IsUnsupportedMetaData() try {
  return has_unsupported_image_metadata_;
}
WINML_CATCH_ALL

HRESULT
TensorFeatureDescriptor::GetName(
    const wchar_t** name,
    uint32_t* cchName) {
  *name = name_.data();
  *cchName = static_cast<uint32_t>(name_.size());
  return S_OK;
}

HRESULT
TensorFeatureDescriptor::GetDescription(
    const wchar_t** description,
    uint32_t* cchDescription) {
  *description = description_.data();
  *cchDescription = static_cast<uint32_t>(description_.size());
  return S_OK;
}
}  // namespace WINMLP
