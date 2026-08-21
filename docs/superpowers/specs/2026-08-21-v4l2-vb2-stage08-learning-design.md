# 阶段 08：V4L2 / VB2 用户态取流学习页整理设计

## 目标

把阶段 08 收敛为一条可在 Source Insight 中逐段验证的取流闭环：

```text
应用 fd
→ V4L2 ioctl 分发
→ VB2 buffer 状态机
→ RKISP 启动与 DMA
→ 帧结束中断
→ vb2_buffer_done(DONE)
→ DQBUF 返回用户态
```

范围只覆盖应用如何使用已存在的 `/dev/videoX`；不重复阶段 07 的 RKISP 注册与上游初始化。

## 页面结构

直接修改 `04-项目/23-V4L2-VB2用户态取流.html`，保留深色泳道视觉、课程导航和阶段跳转。

### 图 1：注册期对象关系与运行期分发

目的：解释应用只有一个 `fd`，V4L2 Core 为什么能回调到 RKISP/VB2。

```text
rkisp_register_stream_vdev()
  ├─ vdev->fops = &rkisp_fops
  ├─ vdev->ioctl_ops = &rkisp_v4l2_ioctl_ops
  ├─ vdev->queue = &node->buf_queue
  └─ video_register_device()
                    ↓
open/ioctl 运行时按函数指针表回调
```

虚线只表示对象赋值；实线只表示实际调用。图中明确 `/dev/video0` 是 `video_device` 注册出的字符设备节点，不是 Sensor 或 DMA buffer。

### 图 2：取流控制链与回帧链

上半部分严格按控制顺序：

```text
open → S_FMT → REQBUFS → QUERYBUF/mmap → QBUF → STREAMON
→ vb2_core_streamon → rkisp_start_streaming
→ rkisp_stream_start → pipe.set_stream(true) → 上游 s_stream(1)
```

下半部分只表达帧完成：

```text
Sensor/CSI/ISP → MI/DMA frame-end IRQ → mi_frame_end
→ vb2_buffer_done(DONE) → done_list/done_wq → DQBUF
```

控制流、数据/完成事件、函数表关系三者使用不同线型，并写清 `STREAMON` 返回 0 不能等同于已有帧。

### 图 3：单个 buffer 状态机

按一个 buffer 画清：

```text
DEQUEUED → PREPARING/PREPARED → QUEUED → ACTIVE → DONE/ERROR → DEQUEUED
```

每个箭头标明触发动作：`QBUF`、`__enqueue_in_driver`、`rkisp_buf_queue`、frame-end IRQ、`DQBUF`。区分“应用拥有”“驱动/DMA 拥有”“已完成待应用领取”。

### 页面文字区

网页只保留：

- 三句话总览：V4L2 ioctl、VB2、RKISP 各自的职责。
- 证据阶梯：open、S_FMT、REQBUFS、QBUF、STREAMON、DQBUF 分别能/不能证明什么。
- Source Insight 最短搜索表：文件、符号、要看到的关系。
- 一个 30 秒面试表达。

不把具体状态机、mplane、NV12 的完整解释重复成网页长文；细节留给源码陪读笔记。

## 源码陪读笔记分工

`02-源码陪读/08-V4L2用户态取流` 继续固定四篇：

| 文件 | 责任 | 不包含 |
|---|---|---|
| `00-源码陪读索引.md` | 总链、先后阅读顺序、最短搜索表、概念边界 | 大段函数逐行解释 |
| `01-生命周期.md` | 注册期挂表、open、`video_ioctl2`、两级 ioctl 分发 | VB2 全状态机 |
| `02-对象与数据链.md` | `vb2_queue`、状态机、DMA/IRQ、`vb2_buffer_done`、DQBUF | 重复的 V4L2 注册细节 |
| `03-调试与面试验收.md` | 板端命令、超时定位、证据边界、面试问题 | 新的源码长文 |

每篇保持：精确文件/符号、直接调用与函数指针回调区分、白话解释、能证明/不能证明、我的回答与高亮正确答案。

## 源码锚点

以 RK3568 4.19 本地学习副本和 WSL 未修改基线共同核对：

```text
drivers/media/platform/rockchip/isp/capture.c
  rkisp_register_stream_vdev
  rkisp_fops
  rkisp_v4l2_ioctl_ops

drivers/media/v4l2-core/v4l2-dev.c
  v4l2_open / v4l2_ioctl / v4l2_mmap

drivers/media/v4l2-core/v4l2-ioctl.c
  video_ioctl2 / __video_do_ioctl / v4l2_ioctls

drivers/media/common/videobuf2/videobuf2-v4l2.c
  vb2_ioctl_reqbufs / qbuf / streamon / dqbuf

drivers/media/common/videobuf2/videobuf2-core.c
  vb2_core_qbuf / vb2_start_streaming / vb2_buffer_done / vb2_core_dqbuf

drivers/media/platform/rockchip/isp/capture_v21.c
  rkisp_buf_queue / rkisp_start_streaming / rkisp_mi_v21_isr / mi_frame_end
```

## 验收

- 08 网页不混淆赋值、回调、直接调用、帧完成事件。
- 网页可直达 08 源码陪读索引；阶段 07/09 跳转不变。
- 三篇正文各自只承担一个学习问题，不复制 07 的初始化解释。
- `media-rkisp-page-diagram` 或新增阶段 08 页面测试覆盖关键函数和语义。
- 运行相关单测、Vault 链接检查与 `git diff --check`。
- 本轮不提交、不 push。
