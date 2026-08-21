# AI Camera 系统数据流与模块边界

这篇笔记先建立全景，再进入各专项。它描述的是当前项目的通用结构；具体板端结论以实验记录为准。

## 一句话理解

系统做了两件事：一条数据流把图像送到显示/网络，一条控制流负责配置设备、启动组件和处理错误。

## 数据流

```text
IMX415 sensor
-> MIPI CSI-2 / D-PHY
-> RK3568 CSI / CIF / RKISP
-> V4L2 video node (/dev/video0)
-> GStreamer v4l2src
-> videoconvert / appsink
-> OpenCV BGR frame
-> resize / letterbox / RGB / layout / quantization
-> RKNN Runtime / NPU
-> decode / confidence filter / NMS / coordinate mapping
-> overlay
-> 结果帧
   ├─ 本地输出：MIPI Display
   └─ 网络输出：encoder -> RTMP server -> HLS segments / Windows player
```

## 控制流

```text
应用启动
-> 检查设备节点和 media topology
-> 协商分辨率、像素格式、帧率
-> 启动采集 pipeline
-> 加载模型并初始化 runtime
-> 循环采集、推理、绘制、输出
-> 统计错误、帧率和延迟
-> 有序释放 buffer、模型、显示和网络资源
```

## 模块边界

| 模块               | 输入             | 输出              | 不负责什么              |
| ---------------- | -------------- | --------------- | ------------------ |
| sensor           | 曝光、寄存器配置       | 原始图像流           | 不负责 OpenCV 或目标检测   |
| CSI/CIF/ISP      | MIPI 原始流       | ISP 处理后的视频流     | 不负责 Python 模型前处理   |
| V4L2             | 内核视频设备         | buffer、格式和控制接口  | 不保证上层颜色格式已匹配       |
| GStreamer        | V4L2 buffer    | 协商后的 pipeline 帧 | 不理解检测框语义           |
| OpenCV           | BGR/RGB 图像     | 矩阵、绘制结果         | 不替代 NPU runtime    |
| RKNN Runtime     | 符合模型输入的 tensor | 模型输出 tensor     | 不自动修正错误的前处理        |
| 后处理              | 模型输出和原图尺寸      | 框、类别、置信度        | 不负责采集稳定性           |
| Display          | 图像 buffer      | 屏幕像素            | 不等于 Camera MIPI 输入 |
| Encoder/RTMP/HLS | 编码帧            | 网络流和切片          | 不保证低延迟播放           |

## 两个关键接口

### Camera -> OpenCV：显式 GStreamer 边界

`已验证`：当前 RKISP V4L2 multiplanar 节点不以 `cv2.VideoCapture(0)` 作为稳定入口；项目使用显式 pipeline：

```text
V4L2 /dev/video0（NV12）
-> GStreamer v4l2src
-> videoconvert（NV12 -> BGR）
-> appsink
-> OpenCV VideoCapture（CAP_GSTREAMER）
-> BGR Mat
```

`通用原理`：GStreamer 负责设备读取、格式协商和颜色转换；`appsink` 是媒体管道向应用交付帧的边界，OpenCV 从这里得到带宽、高和通道信息的 `Mat`。

`待验证`：零拷贝或硬件颜色转换能否替代当前 CPU 路径，以及替代后的格式、延迟和稳定性。

### OpenCV Mat -> preprocess -> RKNN -> postprocess：推理接口

```text
OpenCV BGR Mat
-> preprocess：resize / letterbox / color / layout / quantization
-> RKNN input tensor
-> RKNN Runtime / NPU
-> RKNN output tensor
-> postprocess：decode / confidence filter / NMS / coordinate mapping
-> 检测结果（框、类别、置信度）
-> overlay 到结果帧
```

| 接口                   | 输入约定                               | 输出约定             | 责任边界                    |
| -------------------- | ---------------------------------- | ---------------- | ----------------------- |
| OpenCV -> preprocess | 原始 BGR Mat 与原图尺寸                   | 符合模型要求的输入 tensor | 前处理显式承担尺寸、颜色、布局和量化转换    |
| preprocess -> RKNN   | shape、dtype、layout 与量化参数匹配的 tensor | 原始模型输出 tensor    | Runtime 负责执行，不替应用修正输入语义 |
| RKNN -> postprocess  | 输出 tensor、阈值、anchors/模型解码规则与原图尺寸   | 框、类别、置信度及原图坐标    | 后处理负责解码、筛选、NMS 和坐标回映    |

`已验证`：YOLOv5 RKNN Python MVP 已完成真实 Camera 帧的前处理、NPU 推理、后处理和结果叠加。

`通用原理`：模型文件不是完整应用接口；前处理和后处理必须与模型训练、转换及输出定义一致。

`待验证`：YOLOv8n 的输入输出约定、C++ 接口一致性和不同量化配置下的数值误差。

## 两个输出分支

- `本地显示分支`：结果帧直接进入 Display，在板端 MIPI 屏显示；它不依赖网络服务。
- `网络流分支`：同一结果帧进入编码器，再经 RTMP/HLS 供 Windows 播放；它不替代本地显示。
- `已验证`：两个分支均已在 YOLOv5 RKNN Python MVP 中跑通。
- `通用原理`：推理结果帧是分叉点，显示与网络输出是并列消费者，应分别处理方向、帧率、缓冲和错误。
- `待验证`：双分支并行时的端到端延迟、资源占用、背压与长期稳定性基线。

## 三个必须分开的概念

### `/dev/video0` 不是 Camera 本身

它是 Linux V4L2 暴露给用户态的数据节点。sensor、CSI、ISP、media entity 和 video node 共同构成采集链路。节点存在只能说明接口被注册，不能单独证明 sensor 稳定出帧。

### MIPI Camera 与 MIPI Display 不是一条线

Camera 通常走 CSI 输入，Display 通常走 DSI 输出。二者共享 MIPI 这个物理接口家族，但方向、协议角色和驱动路径不同。

### 推理输出不是最终画面

模型输出通常是 tensor，需要经过解码、置信度筛选、NMS 和坐标回映，才能叠加到原图；原图再进入显示或编码。

## 本项目当前基线

- `已验证`：IMX415 -> V4L2 -> GStreamer -> OpenCV -> YOLOv5 RKNN -> MIPI/HLS。
- `通用原理`：模块边界和数据流分层。
- `待验证`：更换 YOLOv8n、C++ pipeline、零拷贝和端到端延迟基线。

关联：[[Camera驱动能力验收矩阵]]、[[AI Camera故障排查索引]]、[[Camera驱动求职第1周执行计划]]。
