---
title: Java 并发编程
tags: 
  - juc
created: 2022-11-29 03:56:08
modified: 2022-11-29 03:56:08
number headings: auto, first-level 1, max 6, _.1.1.
---

# Java 并发编程

## 1. 环境搭建

### 1.1. 依赖引入

```xml
<properties>
    <junit.version>4.13.2</junit.version>
    <lombok.version>1.18.24</lombok.version>
    <slf4j.version>2.0.3</slf4j.version>
    <logback.version>1.4.3</logback.version>
</properties>

<dependencies>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.13.2</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>${lombok.version}</version>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>${logback.version}</version>
    </dependency>
</dependencies>
```

### 1.2. logback 日志配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5p %c{1}:%L - %m%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%t] %-5p %c{1}:%L - %m%n</pattern>
            <charset>utf-8</charset>
        </encoder>
        <file>log/output.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.FixedWindowRollingPolicy">
            <fileNamePattern>log/output.log.%i</fileNamePattern>
        </rollingPolicy>
        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">
            <MaxFileSize>1MB</MaxFileSize>
        </triggeringPolicy>
    </appender>

    <root level="DEBUG">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

## 2. 进程与线程

### 2.1. 进程

- 程序由指令和数据组成，但这些指令要运行，数据要读写，就必须将指令加载至 CPU，数据加载至内存。在 指令运行过程中还需要用到磁盘、网络等设备。进程就是用来加载指令、管理内存、管理 IO 的 。
- 当一个程序被运行，从磁盘加载这个程序的代码至内存，这时就开启了一个进程。 
- 进程就可以视为程序的一个实例。大部分程序可以同时运行多个实例进程（例如记事本、画图、浏览器 等），也有的程序只能启动一个实例进程（例如网易云音乐、360 安全卫士等）。

### 2.2. 线程

- 一个进程之内可以分为一到多个线程。 
- 一个线程就是一个指令流，将指令流中的一条条指令以一定的顺序交给 CPU 执行。 
- Java 中，**线程作为最小调度单位**，**进程作为资源分配的最小单位**。 在 windows 中进程是不活动的，只是作 为线程的容器。

### 2.3. 二者对比

- 进程基本上相互独立的，而 **线程存在于进程内**，是进程的一个子集。 
- **进程拥有共享的资源，如内存空间等，供其内部的线程共享**。 
- 进程间通信较为复杂 
  - 同一台计算机的进程通信称为 IPC（Inter-process communication） 
  - 不同计算机之间的进程通信，需要通过网络，并遵守共同的协议，例如 HTTP 
- 线程通信相对简单，因为它们 **共享进程内的内存**，一个例子是 **多个线程可以访问同一个共享变量**。 
- 线程更轻量，**线程上下文切换** 成本一般上要比进程上下文切换低。

## 3. 并发与并行

单核 cpu 下，线程实际还是 **串行执行** 的。操作系统中有一个组件叫做 **任务调度器**，将 cpu 的时间片（windows 下时间片最小约为 15 毫秒）分给不同的程序使用，只是由于 cpu 在线程间（时间片很短）的切换非常快，人类感觉是同时运行的 。总结为一句话就是： **微观串行，宏观并行** 。 

一般将这种线程轮流使用 CPU 的做法称为并发。

| CPU  | 时间片 1 | 时间片 2 | 时间片 3 | 时间片 4 |
| :--: | :------: | :------: | :------: | :------: |
| core |  线程 1  |  线程 2  |  线程 3  |  线程 4  |

多核 cpu 下，每个 核（core） 都可以调度运行线程，这时候线程可以是并行的。

|  CPU  | 时间片 1 | 时间片 2 | 时间片 3 | 时间片 4 |
| :---: | :------: | :------: | :------: | :------: |
| core1 |  线程 1  |  线程 2  |  线程 3  |  线程 4  |
| core2 |  线程 4  |  线程 4  |  线程 2  |  线程 2  |

引用 Rob Pike 的一段描述： 

- 并发（concurrent）是同一时间应对（dealing with）多件事情的能力。
- 并行（parallel）是同一时间动手做（doing）多件事情的能力。

## 4. 线程

### 4.1. 创建线程的多种方式