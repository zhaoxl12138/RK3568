# Day 1：设备能力与格式枚举

本实验只查询 `/dev/video0`，不修改格式、不申请 Buffer，也不开流。

## 代码阅读顺序

```text
main()
  → open()
  → query_capabilities()
       └─ VIDIOC_QUERYCAP
  → enumerate_formats()
       └─ VIDIOC_ENUM_FMT（循环到 EINVAL）
  → get_current_format()
       └─ VIDIOC_G_FMT
  → close()
```

## 编译与运行

本板根文件系统没有安装 GCC，因此使用 SDK 自带的 AArch64 交叉编译器编译，再复制到板端运行。

```bash
aarch64-linux-gnu-gcc -Wall -Wextra -O2 -static \
  -o query_device query_device.c

./query_device /dev/video0
```

## 当前板端结论

- `/dev/video0` 的 driver 是 `rkisp_v5`，card 是 `rkisp_mainpath`，所以它是 RKISP 主输出 Video Node，不是 IMX415 Sensor 本体。
- 节点使用 `V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE` API，并支持 Streaming。
- 当前格式是 3840×2160 NV12。
- 当前 `num_planes=1`：Y 与 UV 数据在同一个 V4L2 内存 Plane 中连续保存。
- 查询成功只能证明节点存在并能响应配置查询，不能证明 Sensor 正在持续送帧；真正证据需要 STREAMON、DQBUF 和有效图像。
