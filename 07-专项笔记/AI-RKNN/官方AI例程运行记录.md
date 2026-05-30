# 官方AI例程运行记录

## 当前目标

先跑通官方最小 AI 例程，不直接上 YOLO。

当前状态：最小 `01_lenet` 已跑通。

这个例程的价值：

- `01_lenet` 是最小 RKNN 推理闭环。
- 它不依赖 Camera，不涉及视频流，便于单独验证 NPU/RKNN 运行环境。
- 跑通后才能说明板端 AI 推理链路基本可用。

## 本次选择的例程

官方资料路径：

`E:\【正点原子】RK3568开发板资料（A盘）-基础资料\01、程序源码\01、AI例程\01、源码\01_lenet`

已复制到简单路径：

`E:\RK3568\official_ai_examples\01_lenet`

文件：

- `atk_lenet_demo.py`：Python 推理脚本
- `LeNet5_mnist_model.rknn`：已经转换好的 RKNN 模型
- `5.png`：测试图片

## AI例程测试手册阅读导读

对应文档：

`01、测试文档/03【正点原子】ATK-DLRK3568_AI例程测试手册V1.0.pdf`

这份文档可以分成三类内容：

- 环境类：第 1 章、第 2 章、第 3 章、第 4 章。
- 最小推理类：第 5 章。
- 复杂模型例程类：第 6 章到第 12 章。

当前只看：

- 第 2 章：理解 `rknn_server` 和 `librknnrt.so` 是板端运行库。
- 第 5 章：理解 `RKNN Toolkit Lite2` 是板端 Python 调用 RKNN 模型的接口。
- 第 5.3 节：只关注 `01_lenet` 怎么上传、怎么运行、期望输出是什么。

暂时不看：

- 第 1 章的 VMware/IDE 介绍。
- 第 3 章的完整模型转换环境。
- 第 4 章的 CPU/NPU 定频细节。
- 第 6 章以后的人脸、分割、YOLO、OCR 等复杂例程。

原因：

当前目标不是训练模型，也不是做复杂 AI 应用，而是先确认：

```text
Python -> rknnlite -> RKNN模型 -> NPU/运行库 -> 推理结果
```

## 手册里的关键概念

`rknn-toolkit2`：

```text
宿主机工具，主要用于模型转换、量化、评估。
一般跑在 Ubuntu x86_64 上。
```

`rknn-toolkit-lite2`：

```text
板端 Python 推理接口。
用于在 RK3568 上加载 .rknn 模型并调用 NPU 推理。
```

`rknpu2`：

```text
板端运行库和服务。
核心文件包括 /usr/lib/librknnrt.so 和 /usr/bin/rknn_server。
```

`01_lenet`：

```text
最小 RKNN 推理例程。
输入是 5.png，模型是 LeNet5_mnist_model.rknn，输出是数字分类结果。
```

## 依赖关系

脚本依赖：

- `python3`
- `cv2`
- `numpy`
- `rknnlite`

其中 `rknnlite` 来自 RKNN Toolkit Lite2，不是普通 Python 自带模块。

## 当前板端实际检查结果

2026-05-30 通过串口检查：

```text
cv2       True
numpy     True
rknnlite  False
```

说明：

```text
板端已经有 OpenCV 和 numpy，但还没有安装 RKNN Toolkit Lite2。
```

板端运行库检查：

```text
/usr/bin/rknn_server      存在
/usr/bin/start_rknn.sh    存在
/usr/bin/restart_rknn.sh  存在
/usr/lib/librknnrt.so     存在
```

当前版本：

```text
rknn_server: 1.3.0
librknnrt.so: 1.3.0
```

手册推荐资料包版本：

```text
rknn-toolkit2: 1.5.0
rknpu2:        1.5.0
```

风险判断：

```text
如果只安装 1.5.0 的 rknn_toolkit_lite2，但板端运行库仍是 1.3.0，可能出现版本不兼容。
```

下一步策略：

- 优先从资料包提取 `rknn_toolkit_lite2-1.5.0-cp38-cp38-linux_aarch64.whl`。
- 同步准备 `rknpu2-1.5.0` 中 RK356X Linux aarch64 的 `librknnrt.so` 和 `rknn_server`。
- 跑例程前先决定是否把板端运行库从 1.3.0 更新到 1.5.0。

## 本次实际执行记录

### 准备文件

Windows 临时整理目录：

```text
E:\RK3568\ai_stage
```

包含：

```text
rknn_toolkit_lite2-1.5.0-cp38-cp38-linux_aarch64.whl
runtime/librknnrt.so
runtime/rknn_server
runtime/start_rknn.sh
runtime/restart_rknn.sh
01_lenet/5.png
01_lenet/atk_lenet_demo.py
01_lenet/LeNet5_mnist_model.rknn
```

通过 Windows 临时 HTTP 服务传到板端。

板端目录：

```text
/userdata/ai_stage
/userdata/aidemo/01_lenet
```

### 备份旧运行库

备份目录：

```text
/userdata/rknn_backup_1.3.0
```

备份文件：

```text
librknnrt.so.1.3.0
rknn_server.1.3.0
start_rknn.sh.1.3.0
restart_rknn.sh.1.3.0
backup_time.txt
```

### 更新到 1.5.0

覆盖位置：

```text
/usr/lib/librknnrt.so
/usr/bin/rknn_server
/usr/bin/start_rknn.sh
/usr/bin/restart_rknn.sh
```

安装板端 Python 推理包：

```bash
python3 -m pip install /userdata/ai_stage/rknn_toolkit_lite2-1.5.0-cp38-cp38-linux_aarch64.whl
```

结果：

```text
Successfully installed rknn-toolkit-lite2-1.5.0
rknnlite import ok
```

### 重启 RKNN 服务

命令：

```bash
restart_rknn.sh
```

结果：

```text
start rknn server, version:1.5.0 (17e11b1 build: 2023-05-18 21:43:21)
```

版本确认：

```text
rknn_server: 1.5.0
librknnrt.so: 1.5.0
RKNN Driver: 0.8.2
```

### 运行 01_lenet

命令：

```bash
cd /userdata/aidemo/01_lenet
python3 atk_lenet_demo.py
```

关键输出：

```text
--> Load RKNN model
done
--> Init runtime environment
RKNN Runtime Information: librknnrt version: 1.5.0
RKNN Driver Information: version: 0.8.2
RKNN Model Information: target platform: rk3568
--> Running model
LeNet
-----TOP 5-----
[5]: 1.0
-1: 0.0
-1: 0.0
-1: 0.0
-1: 0.0
done
```

结论：

```text
官方最小 RKNN 推理闭环已跑通。
```

这说明：

- Python 可以导入 `rknnlite`。
- `.rknn` 模型可以加载。
- RKNN runtime 1.5.0 正常。
- NPU 驱动 0.8.2 正常。
- LeNet 手写数字图片 `5.png` 推理结果正确识别为 `5`。

## SCRFD 人脸检测例程

### 测试目标

验证第 6 章的人脸检测例程是否能接入真实 Camera 帧。

目标链路：

```text
IMX415 Camera
-> GStreamer
-> OpenCV BGR Mat
-> SCRFD RKNN
-> 后处理
-> 人脸框 + 5 点关键点
-> JPG
```

### 为什么不能原样运行

官方源码默认：

```python
cap = cv2.VideoCapture(0)
```

但当前板端实测该方式打不开 RKISP Camera。

因此改为已验证的 GStreamer pipeline：

```python
pipeline = (
    "v4l2src device=/dev/video0 "
    "! video/x-raw,format=NV12,width=1280,height=720 "
    "! videoconvert "
    "! video/x-raw,format=BGR "
    "! appsink drop=1 sync=false"
)
cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
```

### 板端路径

```text
/userdata/aidemo/11_facedet_scrfd_npu
```

文件：

```text
scrfd.rknn
main_gst_one_frame.py
```

Windows 改造脚本：

```text
E:\RK3568\face_stage\main_gst_one_frame.py
```

### 第一次结果

第一次没有旋转图像，输出：

```text
opened True
backend GSTREAMER
ret True
shape (720, 1280, 3)
faces 0
write True /tmp/scrfd_result.jpg
```

原因：

```text
Camera 画面方向是横着的，人脸方向不符合模型预期。
```

### 第二次结果

补回官方源码里的旋转：

```python
frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
```

输出：

```text
opened True
backend GSTREAMER
ret True
shape (720, 1280, 3)
faces 1
write True /tmp/scrfd_result.jpg
```

结果图：

```text
E:\RK3568\face_stage\result\scrfd_result_rotated.jpg
```

### 第三次结果（实时 90 帧）

新增实时脚本：

```text
/userdata/aidemo/11_facedet_scrfd_npu/main_gst_realtime.py
```

运行命令：

```bash
python3 main_gst_realtime.py --frames 90 --save-every 30 --output /tmp/scrfd_realtime_last.jpg
```

关键输出：

```text
processed_frames 90
elapsed_sec 13.238
fps 6.798
avg_faces_per_frame 0.889
saved True /tmp/scrfd_realtime_last.jpg
```

结果图：

```text
板端: /tmp/scrfd_realtime_last.jpg
Windows: E:\RK3568\face_stage\result\scrfd_realtime_last.jpg
Obsidian: 08-附录/实验产物/assets/scrfd_realtime_last.jpg
```

脚本、图片和板端路径的完整索引见：

- [[附录-实验产物索引]]

结论：

```text
Camera 实时帧进入 RKNN 人脸检测模型已跑通。
```

这一步比 `01_lenet` 更接近最终项目，因为它已经包含：

- Camera 输入
- OpenCV 图像帧
- RKNN 模型推理
- 检测后处理
- 画框和关键点
- 输出可视化结果

## 当前整理状态

当前已经完成：

- `01_lenet` 最小 RKNN 推理。
- `11_facedet_scrfd_npu` 单帧 Camera 人脸检测。
- `11_facedet_scrfd_npu` 实时 90 帧检测（含 FPS 统计与结果图保存）。
- 脚本和结果图已登记到 [[附录-实验产物索引]]。

后续不继续在本文追加临时路径，新增实验产物统一放入 [[附录-实验产物索引]]。

#AI #RKNN #NPU #例程
