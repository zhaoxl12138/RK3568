# Day 3：申请与映射 Buffer

今天只认识三个动作：

```text
VIDIOC_REQBUFS
→ 请求驱动建立若干 MMAP Buffer

VIDIOC_QUERYBUF
→ 查询指定 Buffer 每个内存 Plane 的长度和 mmap 偏移量

mmap
→ 在当前进程建立虚拟地址映射，让应用以后能读取该 Buffer
```

最重要的边界：

- `REQBUFS` 返回的 `count` 可能和应用请求值不同，必须使用驱动回填值。
- `QUERYBUF` 不复制图像，只返回 Buffer 元数据。
- `mmap` 不复制图像，只建立用户虚拟地址到内核 Buffer 的映射关系。
- 当前 NV12 的 `num_planes=1`，所以每个 Buffer 只映射一个内存 Plane。
- 此时尚未 `QBUF` 和 `STREAMON`，映射区域中没有可证明有效的新图像。
