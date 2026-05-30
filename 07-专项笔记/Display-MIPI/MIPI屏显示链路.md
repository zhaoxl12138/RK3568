# MIPI屏显示链路

## 当前结论

当前已经验证：

```text
Camera -> GStreamer -> OpenCV -> SCRFD RKNN -> cv2.imshow() -> MIPI屏
```

板端命令：

```bash
cd /userdata/aidemo/11_facedet_scrfd_npu
python3 main_gst_realtime.py --frames 300 --save-every 60 --display
```

结果：

```text
processed_frames 300
elapsed_sec 45.322
fps 6.619
avg_faces_per_frame 0.913
```

现象：

```text
MIPI 屏可以实时显示 Camera 画面和 SCRFD 人脸检测框。
```

这说明当前 Buildroot 出厂系统里，OpenCV 的窗口显示能力可用，`cv2.imshow()` 能把图像显示到板载 MIPI 屏。

## 这次到底验证了什么

这次不是单纯验证 AI 推理，而是验证显示闭环：

```text
OpenCV Mat -> OpenCV HighGUI窗口 -> 板端显示系统 -> MIPI屏
```

其中：

- `OpenCV Mat` 是内存中的图像帧。
- `cv2.imshow()` 是 OpenCV 的窗口显示接口。
- MIPI 屏是最终显示设备。
- 中间真正负责把窗口画到屏幕上的，通常是系统里的窗口/图形后端。

## cv2.imshow是什么

`cv2.imshow()` 不是直接驱动 MIPI 屏。

它的作用是：

```text
把一张 OpenCV Mat 交给 OpenCV HighGUI 显示窗口。
```

能不能显示出来，取决于 OpenCV 编译时启用了什么图形后端，以及系统当前有没有可用的显示环境。

常见后端包括：

- GTK
- Qt
- X11
- Wayland
- framebuffer/其他嵌入式显示适配

当前板端能显示，说明正点原子出厂 Buildroot 镜像已经把这条显示路径配好了。

## MIPI屏是什么

这里的 MIPI 屏指的是开发板连接的 MIPI DSI 显示屏。

它在系统里不是 `/dev/video*` 这种 Camera 节点，而是显示输出设备。

大致链路是：

```text
应用程序
-> 图形/窗口系统
-> DRM/KMS 或 framebuffer
-> MIPI DSI控制器
-> MIPI屏
```

当前你看到画面，说明底层显示驱动、屏幕时序、图形输出路径已经由出厂镜像配置好。

## framebuffer和DRM是什么

### framebuffer

framebuffer 是比较老但直观的 Linux 显示接口。

典型设备名：

```text
/dev/fb0
```

可以理解为：

```text
应用把像素写到一块显示内存，屏幕控制器把这块内存扫到屏幕上。
```

优点：

- 简单。
- 嵌入式资料多。
- 适合做最小显示验证。

缺点：

- 现代图形能力弱。
- 多窗口、合成、硬件加速管理不如 DRM/KMS。

### DRM/KMS

DRM/KMS 是现代 Linux 图形显示框架。

常见设备名：

```text
/dev/dri/card0
/dev/dri/renderD128
```

可以理解为：

```text
更现代的显示控制、图层、buffer、plane、显示时序管理框架。
```

后续如果做更真实的工程化显示，DRM/KMS 比 framebuffer 更值得学习。

## Qt和OpenCV显示的区别

OpenCV 显示：

```text
适合快速验证图像处理和AI效果。
```

优点：

- 调试快。
- 代码少。
- 跟 Python/OpenCV 实验很自然。

缺点：

- 不适合做正式产品 UI。
- 控件、布局、交互能力弱。
- 性能和窗口管理不一定可控。

Qt 显示：

```text
适合做正式应用界面。
```

优点：

- 有按钮、布局、页面、状态栏等 UI 能力。
- 适合产品演示和工程项目。

缺点：

- 当前阶段会分散注意力。
- 你现在目标不是做 UI，而是打通 AI 视觉系统链路。

当前策略：

```text
短期继续用 cv2.imshow() 做实时感官验证。
中期做 C++/CMake 项目时保留显示模块接口。
后期如果需要产品级 UI，再考虑 Qt 或 DRM/KMS。
```

## 当前项目中的定位

你现在已经有三种输出方式：

```text
1. 保存 JPG：适合离线验证。
2. MIPI 屏实时显示：适合现场调试和感官验证。
3. 后续 RTSP/RTMP：适合远程查看和网络视频链路。
```

当前优先级：

```text
MIPI屏实时显示 > 保存JPG > RTSP/RTMP
```

原因：

- MIPI 屏反馈最快。
- 能立刻看到 Camera、方向、检测框、卡顿和延迟。
- 对你理解 AI Camera 系统更直观。

## 后续正式项目建议

正式 C++ 项目中建议拆成这些模块：

```text
CameraCapture
Detector
DisplaySink
RtspSink
AppPipeline
```

其中 `DisplaySink` 可以先简单对应：

```text
cv::imshow()
```

后续再替换成：

```text
framebuffer / DRM / Qt / SDL
```

这样不会把显示方式写死在推理代码里。

## 当前不需要深挖

暂时不用深入：

- DRM plane
- zero-copy buffer
- EGL
- GBM
- RGA 显示加速
- Qt 界面开发

这些都属于后续优化或产品化阶段。

现在最重要的是保持主线：

```text
Camera -> OpenCV -> RKNN -> Display/Stream
```

#MIPI #Display #OpenCV #Framebuffer #DRM #AI视觉
