# AI Camera 故障排查索引

先判断故障在哪一层，再进入专项笔记。不要因为上层程序报错，就直接假设底层 Camera 或模型坏了。

## 总排障树

```text
应用启动失败
├─ 没有 /dev/video* 或 /dev/media*
│  └─ 查设备树、驱动加载、dmesg、media topology
├─ 节点存在但没有帧
│  └─ 查链路状态、sensor 模式、分辨率、格式、帧率、buffer
├─ v4l2-ctl 能抓帧，OpenCV 失败
│  └─ 查 OpenCV backend、GStreamer caps、videoconvert、appsink
├─ 图像能显示，推理异常
│  └─ 查 RGB/BGR、resize、letterbox、NHWC/NCHW、量化和模型版本
├─ 推理有结果，框位置错误
│  └─ 查 padding、缩放比例、解码、NMS 和坐标回映
├─ 本地显示正常，网络播放失败
│  └─ 查编码器、封装、RTMP 地址、服务端端口、HLS 文件和播放器缓存
└─ 全链路能跑但延迟高
   └─ 分别测采集、队列、推理、编码、网络、切片和播放器缓冲
```

## 第一检查点

### 1. 设备节点问题

先确认：

```bash
ls -l /dev/video* /dev/media*
dmesg | grep -Ei 'imx415|csi|isp|v4l2|media'
media-ctl -p
```

若没有节点，先不要运行 Python、OpenCV 或 RKNN；问题仍在驱动、设备树或系统启动层。

### 2. 格式和抓帧问题

```bash
v4l2-ctl -d /dev/video0 --all
v4l2-ctl -d /dev/video0 --list-formats-ext
v4l2-ctl -d /dev/video0 --stream-mmap --stream-count=1 --stream-to=frame.nv12
```

检查输出文件大小是否与 `width * height * 1.5` 接近；还要注意实际 stride 可能大于 width，不能只凭文件大小猜格式。

### 3. OpenCV/GStreamer 问题

先证明 V4L2 能抓帧，再逐项检查：设备路径、caps、颜色转换、appsink、OpenCV 是否带 GStreamer backend。`cv2.VideoCapture(0)` 失败不能推出底层 Camera 失败。

### 4. RKNN/YOLO 问题

按顺序记录：模型文件、runtime 版本、输入 shape、颜色顺序、数据类型、量化范围、输出 tensor 数量、后处理版本。先用固定图片复现，再接实时 Camera，避免同时引入两个变量。

### 5. 网络播放问题

按层检查：编码器是否产出帧、RTMP server 是否监听、推流地址是否正确、HLS 是否生成 `.m3u8` 和分片、Windows 播放器是否访问了正确 IP/端口。

## 证据记录模板

```markdown
### 故障标题

- 现象：
- 最先确认的层：
- 命令和输出：
- 排除的假设：
- 根因：
- 修复：
- 复测证据：
- 状态：已验证 / 通用原理 / 待验证
```

关联：[[V4L2命令行抓帧记录]]、[[OpenCV读取Camera记录]]。YOLO/RKNN 与推流排障已经移入历史归档。
