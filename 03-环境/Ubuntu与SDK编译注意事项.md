# Ubuntu与SDK编译注意事项

## 官方建议

正点原子资料明确建议使用 `Ubuntu20`。

原因：

- Ubuntu22/24 这类高版本可能编译不过。
- SDK 对 Python、GCC、系统库版本比较敏感。
- 如果用户改过 Python/GCC 或引入其他 GCC 环境，也可能导致编译失败。

## 路径规则

Ubuntu 下：

- SDK 路径不要有中文。
- SDK 路径不要有空格。
- 不要用 `sudo` 或 `root` 解压 SDK。
- 不要用 `sudo` 或 `root` 编译 SDK。

推荐路径：

```bash
/home/rk3568/work/rk3568_sdk
```

## 资源建议

资料中建议：

- 虚拟机内存建议 16G。
- 8G 是最低要求。
- 磁盘读写太慢可能导致编译很慢甚至卡住。

我的宿主机：

- Windows 10
- Ryzen 5 5600
- 32GB 内存
- 当前 WSL2 Ubuntu 22.04

## 当前策略

- Ubuntu20.04 WSL2：已安装到 `E:\wsl\Ubuntu-20.04`，用于 Buildroot SDK 编译，更贴合官方资料。
- Ubuntu22.04 WSL2：旧环境记录，后续可用于普通 C++、OpenCV、项目工程开发。

## 相关笔记

- [[WSL2开发环境现状]]
- [[附录-资料汇总PDF注意事项]]
- [[00-当前阅读位置和下一步文档]]

#Ubuntu #WSL2 #SDK #Buildroot

