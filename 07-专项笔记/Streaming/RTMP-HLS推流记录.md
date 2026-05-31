# RTMP-HLS推流记录

## 当前目标

把已经跑通的 AI 画面从板端推出去，让 Windows 能作为客户端拉流观看。

当前验证链路：

```text
Camera -> OpenCV -> YOLOv5 RKNN -> BGR画框 -> FFmpeg编码 -> RTMP -> Nginx -> HLS -> Windows拉流
```

## 对应官方文档

```text
03、辅助文档/18【正点原子】ATK-DLRK3568_RTMP推流V1.1.pdf
```

本轮只看：

- `1.2 视频监控简介`
- `1.3 Nginx流媒体服务器`
- `1.4 FFmpeg推流`

暂时不深挖：

- 复杂低延迟优化。
- RTSP server。
- WebRTC。
- 多路流。

## 板端组件确认

已确认板端存在：

```text
GStreamer 1.20.0
FFmpeg 4.1.3
nginx 1.12.2
nginx-rtmp-v1.2.1
mpph264enc
rtmpsink
v4l2-ctl
```

重要发现：

```text
GStreamer 有 rtmpsink，但缺 flvmux。
所以第一轮不走纯 GStreamer RTMP 推流。
改为 Python/OpenCV 输出 BGR 帧，经 FFmpeg 封装 FLV/RTMP。
```

## Nginx配置

已给 `/etc/nginx/nginx.conf` 增加 RTMP 配置：

```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            hls on;
            hls_path /tmp/hls;
            hls_fragment 5s;
        }
    }
}
```

已给 HTTP server 增加 HLS 访问路径：

```nginx
location /hls {
    types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
    }
    root /tmp;
    add_header Cache-Control no-cache;
}
```

注意：

```text
/tmp/hls 必须允许 nginx worker 写入。
当前处理方式：mkdir -p /tmp/hls && chmod 777 /tmp/hls
```

## 测试源推流验证

先用 FFmpeg 自带测试源验证 RTMP/HLS 通道：

```bash
ffmpeg -hide_banner -re \
  -f lavfi -i testsrc=size=640x480:rate=15 \
  -t 30 \
  -pix_fmt yuv420p \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -f flv rtmp://127.0.0.1/live/mytest
```

验证结果：

```text
/tmp/hls/mytest.m3u8
/tmp/hls/mytest-0.ts
/tmp/hls/mytest-1.ts
```

Windows 可访问：

```text
http://192.168.0.230/hls/mytest.m3u8
```

并已保存测试拉流文件：

```text
E:\RK3568\hls_pull_test.mp4
```

## YOLOv5 AI画面推流

新增脚本：

```text
WSL：\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\yolov5_object\main_gst_rtmp_hls.py
板端：/userdata/aidemo/06_yolov5_python/main_gst_rtmp_hls.py
```

板端命令：

```bash
cd /userdata/aidemo/06_yolov5_python
python3 main_gst_rtmp_hls.py \
  --model yolov5s_relu_tk2_RK356X_i8.rknn \
  --anchors RK_anchors_yolov5.txt \
  --labels coco_80_labels_list.txt \
  --frames 60 \
  --stream-width 640 \
  --stream-height 360 \
  --stream-fps 5 \
  --output /tmp/yolov5_rtmp_last.jpg
```

实测输出：

```text
frame 10 fps 4.777 detections 1
frame 20 fps 4.849 detections 1
frame 30 fps 4.982 detections 1
frame 40 fps 5.063 detections 1
frame 50 fps 5.066 detections 1
frame 60 fps 5.096 detections 1
processed_frames 60
elapsed_sec 11.867
fps 5.056
avg_detections_per_frame 1.100
rtmp_url rtmp://127.0.0.1/live/yolo
saved True /tmp/yolov5_rtmp_last.jpg
```

HLS输出：

```text
/tmp/hls/yolo.m3u8
/tmp/hls/yolo-0.ts
```

Windows 拉流地址：

```text
http://192.168.0.230/hls/yolo.m3u8
```

Windows 保存结果：

```text
E:\RK3568\yolo_hls_pull_test.mp4
E:\RK3568\yolo_hls_pull_test_frame.jpg
```

预览：

![[yolo_hls_pull_test_frame.jpg]]

## 当前结论

已跑通：

```text
Camera -> YOLOv5 RKNN -> RTMP/HLS -> Windows拉流
```

这已经是 AI Camera 项目的第一版网络输出闭环。

## 当前问题

- RTMP 直接用 Windows FFmpeg/ffprobe 拉流暂未成功，但 HLS 拉流已成功。
- 当前链路使用 FFmpeg `libx264` 软件编码，后续可尝试硬件编码。
- 当前 HLS 延迟天然比 RTSP/RTMP 直拉高，不是最终低延迟方案。
- RKNN runtime warning 仍然会刷屏，不影响功能。

## 下一步

已完成：

```text
固定一键运行脚本
```

脚本路径：

```text
WSL：\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\scripts\start_yolov5_hls_demo.sh
板端：/userdata/aidemo/06_yolov5_python/start_yolov5_hls_demo.sh
```

部署脚本：

```text
\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\scripts\deploy_yolov5_demo.sh
```

板端一键启动：

```bash
cd /userdata/aidemo/06_yolov5_python
./start_yolov5_hls_demo.sh
```

常用测试：

```bash
FRAMES=30 STREAM_NAME=yolo_demo ./start_yolov5_hls_demo.sh
```

脚本输出：

```text
AI Camera HLS demo starting
RTMP: rtmp://127.0.0.1/live/yolo_demo
HLS : http://192.168.0.230/hls/yolo_demo.m3u8
Frames: 30
Output: /tmp/yolov5_rtmp_last.jpg
```

一键脚本复测结果：

```text
processed_frames 30
elapsed_sec 6.071
fps 4.941
avg_detections_per_frame 1.033
rtmp_url rtmp://127.0.0.1/live/yolo_demo
saved True /tmp/yolov5_rtmp_last.jpg
```

下一步：

```text
整理 README 和演示说明
```

然后再做：

```text
降低延迟 / 尝试硬件编码 / 尝试 RTSP
```

#RTMP #HLS #FFmpeg #Nginx #YOLOv5 #推流
