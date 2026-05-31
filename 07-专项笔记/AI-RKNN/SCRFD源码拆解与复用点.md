# SCRFD源码拆解与复用点

## 当前结论

SCRFD 的定位：

```text
SCRFD 用于验证 Camera -> OpenCV -> RKNN 汇合链路，不是最终项目主模型。
当前最终展示主线已经切到 YOLOv5 RKNN Python MVP。
```

`11_facedet_scrfd_npu` 已经验证过两条链路：

- 单帧链路：Camera -> GStreamer -> OpenCV -> SCRFD RKNN -> JPG。
- 实时链路：Camera -> GStreamer -> OpenCV -> SCRFD RKNN -> FPS 统计 -> JPG。

两个脚本最初重复了大量代码，主要重复在：

- Camera 打开逻辑。
- SCRFD 模型加载。
- SCRFD 前处理。
- RKNN 推理。
- 后处理、NMS、画框、关键点绘制。

## 当前代码拆分

WSL 项目目录：

```text
\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\scrfd_face
```

拆分后的公共模块：

```text
camera_gst.py
scrfd_detector.py
```

入口脚本：

```text
main_gst_one_frame.py
main_gst_realtime.py
```

## 各文件职责

`camera_gst.py`：

```text
只负责打开 Camera。
当前固定使用 /dev/video0、1280x720、NV12、GStreamer、BGR appsink。
```

`scrfd_detector.py`：

```text
只负责 SCRFD 模型推理。
包括 resize、padding、RKNN inference、bbox/keypoint decode、NMS、画框。
```

`main_gst_one_frame.py`：

```text
只负责单帧验证。
适合调通 Camera、模型、后处理和结果图保存。
```

`main_gst_realtime.py`：

```text
只负责实时循环验证。
适合观察连续帧稳定性、粗略 FPS、平均检测数量。
```

## 为什么这样拆

这不是为了“写得好看”，而是为了后续正式项目迁移：

- Camera 输入后面可能换成 C++ V4L2/GStreamer。
- SCRFD 可能换成 YOLOv8n。
- 输出后面可能换成 RTSP/RTMP。
- 单帧测试和实时测试不应该各自复制一份模型后处理代码。

拆分后，后续替换模型或替换输入源时，影响范围更小。

## 历史验证状态

已完成：

```text
WSL 本地 py_compile 语法检查通过。
```

历史待办 / 当时状态：

```text
复制拆分后的 4 个 Python 文件到板端。
在板端重新跑 main_gst_one_frame.py。
在板端重新跑 main_gst_realtime.py 短帧数测试。
```

原因：

```text
当前 Codex 不能直接通过 SSH 登录板端，OpenSSH 返回 Permission denied。
MobaXterm 里可以登录，但 Codex 不能直接接管 MobaXterm 会话。
```

当前状态：

```text
这组待办不是当前主线任务。
当前主线是复盘已经跑通的 YOLOv5 Python MVP，并把 Camera、OpenCV、RKNN、MIPI、HLS 链路讲清楚。
```

## 板端复测命令

进入目录：

```bash
cd /userdata/aidemo/11_facedet_scrfd_npu
```

单帧复测：

```bash
python3 main_gst_one_frame.py
```

实时短测：

```bash
python3 main_gst_realtime.py --frames 30 --save-every 30 --output /tmp/scrfd_realtime_refactor.jpg
```

期望现象：

```text
opened True
backend GSTREAMER
单帧能输出 faces 数量并保存 /tmp/scrfd_result.jpg
实时短测能输出 processed_frames、fps，并保存 /tmp/scrfd_realtime_refactor.jpg
```

#AI #RKNN #SCRFD #源码拆解
