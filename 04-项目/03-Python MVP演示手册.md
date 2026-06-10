# Python MVP演示手册

这份文档用于复现已经跑通的 Python AI Camera 闭环。

如果目的是从零学习原理，先看 [[02-从零到Python MVP学习路线]]。

## 演示链路

```text
IMX415 MIPI Camera
-> RKISP / V4L2
-> GStreamer
-> OpenCV
-> YOLOv5 RKNN / NPU
-> 检测框绘制
-> MIPI屏显示
-> RTMP/HLS推流
-> Windows播放验证
```

## 复现前先确认

板端 IP：

```text
192.168.0.230
```

板端目录：

```text
/userdata/aidemo/06_yolov5_python
```

WSL 项目目录：

```text
/home/rk3568/work/rk3568_ai_camera
```

Windows 工作目录：

```text
E:\RK3568
```

## 部署

在 WSL 中执行：

```bash
cd /home/rk3568/work/rk3568_ai_camera
./scripts/deploy_yolov5_demo.sh
```

这一步会同步：

- YOLOv5 Python 脚本。
- RKNN 模型。
- anchors 文件。
- labels 文件。
- 一键启动脚本。

## 启动完整演示

板端执行：

```bash
cd /userdata/aidemo/06_yolov5_python
SHOW_MIPI=1 FRAMES=0 ./start_yolov5_hls_demo.sh
```

含义：

- `SHOW_MIPI=1` 开启板端 MIPI 屏显示。
- `FRAMES=0` 表示持续运行。
- 脚本会准备 HLS 目录、检查 Nginx、启动 YOLOv5 推流。

## 短测试

如果只想快速验证：

```bash
cd /userdata/aidemo/06_yolov5_python
SHOW_MIPI=1 FRAMES=60 STREAM_NAME=yolo_test ./start_yolov5_hls_demo.sh
```

短测试建议至少 60 帧，因为 HLS 需要时间生成 `.m3u8`。

## Windows 拉流

必须在 Windows PowerShell / Windows Terminal 执行：

```powershell
ffplay http://192.168.0.230/hls/yolo.m3u8
```

如果使用短测试名称：

```powershell
ffplay http://192.168.0.230/hls/yolo_test.m3u8
```

保存 2 秒视频：

```powershell
ffmpeg -y -i http://192.168.0.230/hls/yolo.m3u8 -t 2 -c copy E:\RK3568\yolo_pull_test.mp4
```

## 当前默认方向

```text
ROTATE=none
DISPLAY_ROTATE=ccw
STREAM_ROTATE=ccw
```

含义：

- `ROTATE` 影响模型输入前的 Camera 帧。
- `DISPLAY_ROTATE` 只影响 MIPI 屏显示。
- `STREAM_ROTATE` 只影响 HLS/Windows 拉流。

不要再优先使用：

```bash
DISPLAY=1
```

原因：

```text
DISPLAY 是 Linux 图形环境变量，容易和 OpenCV/Qt 冲突。
当前统一使用 SHOW_MIPI=1。
```

## 分辨率和比例

MIPI 屏当前按竖屏处理：

```bash
SHOW_MIPI=1 DISPLAY_WIDTH=720 DISPLAY_HEIGHT=1280 ./start_yolov5_hls_demo.sh
```

推流分辨率：

```bash
STREAM_WIDTH=640 STREAM_HEIGHT=360 STREAM_FPS=5 ./start_yolov5_hls_demo.sh
```

当前推流端已经使用等比例缩放补边，避免 Windows 画面被强制拉伸。

## 常见问题

### 1. 板端 ffplay 报 No available video device

现象：

```text
Could not initialize SDL - No available video device
```

原因：

```text
你在板子 SSH 终端里运行了 ffplay。
SSH 环境没有图形显示设备给 ffplay 使用。
```

处理：

```text
Windows 拉流命令必须在 Windows 终端执行。
```

### 2. Windows 拉流 404

常见原因：

- Python demo 没有运行。
- HLS `.m3u8` 还没生成。
- Camera 被其他程序占用，demo 没启动成功。
- 使用了错误的 `STREAM_NAME`。

检查：

```bash
ls -lh /tmp/hls
wget -O - http://127.0.0.1/hls/yolo.m3u8
```

### 3. /dev/video0 busy

现象：

```text
Device or resource busy
```

原因：

```text
屏幕 Camera 应用或旧 demo 正在占用 /dev/video0。
```

处理：

```text
关闭屏幕相机应用或停止旧 demo。
```

### 4. MIPI 和 Windows 方向不同

处理原则：

```text
不要用一个 ROTATE 同时修 MIPI 和 HLS。
分别调 DISPLAY_ROTATE 和 STREAM_ROTATE。
```

## 已验证结果

```text
YOLOv5 + MIPI屏实时显示：约 3.8 - 4.1 FPS
YOLOv5 + RTMP/HLS 输出：约 4.9 - 5.0 FPS
```

这说明链路已通，但不是最终性能。

## 当前结论

Python MVP 已经完成第一轮完整闭环。

下一步：

```text
按 [[02-从零到Python MVP学习路线]] 把每个阶段原理补齐。
补齐后再进入 C++17/CMake 工程化升级。
```

相关笔记：

- [[YOLOv5 Python最小推理记录]]
- [[MIPI屏显示链路]]
- [[RTMP-HLS推流记录]]
- [[OpenCV读取Camera记录]]
- [[01-实验产物索引]]

#PythonMVP #演示 #YOLOv5 #RKNN #MIPI #HLS
