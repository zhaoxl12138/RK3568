# OpenCV读取Camera记录

## 2026-05-30

## 本次要解决什么

验证 Camera 图像能不能从底层 `V4L2` 采集，进入 OpenCV 处理层。

当前链路：

```text
IMX415 MIPI Camera
-> RKISP
-> /dev/video0
-> GStreamer pipeline
-> OpenCV Mat
-> JPG 文件
```

这一步的意义是：后面 YOLO/RKNN 不直接吃 `/dev/video0`，而是吃 OpenCV 或类似视频处理模块输出的图像帧。

## 对应官方文档

`03、辅助文档/19【正点原子】ATK-DLRK3568_OpenCV4使用手册V1.0.pdf`

重点结论：

- 出厂 Buildroot 系统已经内置 OpenCV 4.5.5。
- Python 可以直接在板端 `import cv2`，不需要交叉编译。
- C++ OpenCV 程序需要在 Ubuntu 20.04 里用正点原子交叉编译工具链编译。
- 文档里的简单示例主要是读图片并显示窗口，不是完整 Camera 工程教程。

暂时不用看：

- Qt 版本 OpenCV。
- Weston/HDMI 显示问题。
- 复杂 UI 显示。

## 板端 OpenCV 环境确认

命令：

```bash
python3 - <<'PY'
import sys
print('python', sys.version)
import cv2
print('cv2 imported')
print('cv2 version', cv2.__version__)
PY
```

结果：

```text
python 3.8.6
cv2 imported
cv2 version 4.5.5
```

结论：

```text
板端 Python OpenCV 可用，当前阶段不需要先搭交叉编译环境。
```

## 第一次尝试：默认 OpenCV 打开失败

测试代码：

```python
import cv2

cap = cv2.VideoCapture('/dev/video0')
print('opened', cap.isOpened())
ret, frame = cap.read()
print('ret', ret)
print('shape', None if frame is None else frame.shape)
cap.release()
```

结果：

```text
opened False
ret False
shape None
```

关键告警：

```text
OpenCV | GStreamer warning: unable to start pipeline
```

## 第二次尝试：强制 V4L2 后端失败

测试代码：

```python
import cv2

cap = cv2.VideoCapture(0, cv2.CAP_V4L2)
print('opened', cap.isOpened())
ret, frame = cap.read()
print('ret', ret)
cap.release()
```

结果：

```text
VIDEOIO(V4L2:/dev/video0): can't open camera by index
opened False
ret False
```

判断：

```text
OpenCV 默认 V4L2 打开方式不适合当前 RKISP mplane Camera 节点。
```

这不代表 Camera 不行，因为同一时间 `v4l2-ctl` 可以正常抓帧。

## 重新确认底层 Camera 正常

命令：

```bash
v4l2-ctl -d /dev/video0 \
  --set-fmt-video=width=1280,height=720,pixelformat=NV12 \
  --stream-mmap=3 \
  --stream-count=1 \
  --stream-to=/tmp/check_v4l2.yuv
```

结果：

```text
/tmp/check_v4l2.yuv
大小 1.4M
```

结论：

```text
底层 V4L2/RKISP 采集正常，问题在 OpenCV 打开方式。
```

## 成功方案：OpenCV 使用显式 GStreamer pipeline

先确认 GStreamer 可以直接抓 NV12：

```bash
gst-launch-1.0 -q \
  v4l2src device=/dev/video0 num-buffers=1 \
  ! video/x-raw,format=NV12,width=1280,height=720 \
  ! filesink location=/tmp/gst_check_nv12.yuv
```

结果：

```text
/tmp/gst_check_nv12.yuv
大小 1.4M
```

OpenCV 测试代码：

```python
import cv2

out = '/tmp/opencv_frame_gst.jpg'
pipeline = (
    'v4l2src device=/dev/video0 '
    '! video/x-raw,format=NV12,width=1280,height=720 '
    '! videoconvert '
    '! video/x-raw,format=BGR '
    '! appsink drop=1 sync=false'
)

cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
print('opened', cap.isOpened())
if cap.isOpened():
    print('backend', cap.getBackendName())

ret, frame = cap.read()
print('ret', ret)
print('shape', None if frame is None else frame.shape)

if ret:
    ok = cv2.imwrite(out, frame)
    print('write', ok, out)

cap.release()
```

结果：

```text
opened True
backend GSTREAMER
ret True
shape (720, 1280, 3)
write True /tmp/opencv_frame_gst.jpg
```

文件：

```text
/tmp/opencv_frame_gst.jpg
大小 266K
JPEG 1280x720
```

Windows 取回位置：

```text
E:\RK3568\opencv_test\opencv_frame_gst.jpg
```

WSL 项目实验脚本：

```text
\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\opencv_camera\opencv_capture_gst.py
```

完整产物索引见：

- [[附录-实验产物索引]]

## 当前结论

已经跑通：

```text
/dev/video0 -> GStreamer -> OpenCV -> BGR Mat -> JPG
```

关键经验：

- 不要直接相信 `cv2.VideoCapture(0)` 一定能打开板端 Camera。
- RK3568 的 Camera 是 RKISP/mplane 链路，OpenCV 默认打开方式可能失败。
- 当前稳定方案是显式写 GStreamer pipeline。
- OpenCV 读到的 `frame.shape = (720, 1280, 3)`，说明已经从 NV12 转成 BGR 三通道图像。

下一步：

```text
把这个 Python 验证脚本固化成项目实验代码。
然后再进入官方 AI 例程文档，不直接跳 RKNN 部署。
```

## 关联

- [[V4L2命令行抓帧记录]]
- [[00-当前阅读位置和下一步文档]]
- [[下一步任务看板]]
- [[附录-实验产物索引]]

#OpenCV #Camera #GStreamer #V4L2 #RK3568
