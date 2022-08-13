// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma once

#include <memory>

#include "vulkan_common.h"

#include "core/framework/allocator.h"

namespace onnxruntime {

class VulkanAllocator : IAllocator {
 public:
  VulkanAllocator(const VkDevice& logical_device, size_t memory_type_index);

  void* Alloc(size_t size) override;

  void Free(void* ptr) override;

  ORT_DISALLOW_COPY_ASSIGNMENT_AND_MOVE(VulkanAllocator);

 private:
  const VkDevice& logical_device_;
  size_t memory_type_index_;
};

class VulkanMemory {
 public:
  VulkanMemory(const VkDevice& logical_device, const VkMemoryAllocateInfo& info);
  virtual ~VulkanMemory();

  VkDeviceMemory Get() const {
    return memory_;
  }

  uint32_t Type() const {
    return type_index_;
  }

  VkDeviceSize Size() const {
    return size_;
  }

  ORT_DISALLOW_COPY_ASSIGNMENT_AND_MOVE(VulkanMemory);

 private:
  const VkDevice& logical_device_;
  VkDeviceMemory memory_;
  uint32_t type_index_;
  VkDeviceSize size_;
};

class VulkanMemoryPool {
 public:
  VulkanMemoryPool(const VkDevice& logical_device,
                   VkPhysicalDeviceMemoryProperties physical_device_memory_props,
                   uint32_t queue_family_index_);

  virtual ~VulkanMemoryPool() = default;

  const VkDevice& GetLogicalDevice() {
    return logical_device_;
  }

  // <VulkanMemory* , offset>
  std::pair<void*, int> Alloc(const VkMemoryRequirements& requirements, VkFlags alloc_flags);

  void Free(std::pair<void*, int>& memory);

  // Allocate and free VkBuffer
  VkBuffer AllocVkBuffer(size_t size, VkBufferUsageFlags flags, VkSharingMode shared);

  void FreeVkBuffer(VkBuffer buffer);

  // Allocate and free VkImage
  VkImage AllocVkImage(const std::tuple<VkImageType, int64_t, int64_t, int64_t, VkFormat>& image_info);

  void FreeVkImage(VkImage image);

  ORT_DISALLOW_COPY_ASSIGNMENT_AND_MOVE(VulkanMemoryPool);

 private:
  std::vector<std::unique_ptr<VulkanAllocator>> allocators_;

  const VkDevice& logical_device_;
  VkPhysicalDeviceMemoryProperties physical_device_memory_props_;
  uint32_t queue_family_index_;
};
}  // namespace onnxruntime