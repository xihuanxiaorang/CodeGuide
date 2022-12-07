---
title: CopyOnWriteArrayList 源码分析
tags: 
  - 集合
  - 源码
created: 2022-11-28 06:27:30
modified: 2022-11-28 06:28:10
number headings: auto, first-level 1, max 6, _.1.1.
---

# CopyOnWriteArrayList 源码分析

## 1. 写时复制（COW）思想

> 写时复制（`CopyOnWrite`，简称 `COW`）思想是计算机程序设计领域中的一种优化策略。其核心思想是，如果多个调用者（Callers）同时要求相同的资源（如内存或者是磁盘上的数据存储），他们会 **共同获取相同的指针指向相同的资源，直到某个调用者试图修改资源内容时，系统才会真正复制一份专用副本（`private copy`）给该调用者，而其他调用者所见到的最初的资源仍然保持不变**。这过程对其他的调用者都是透明的（`transparently`）。此做法主要的优点是如果调用者没有修改资源，就不会有副本（`private copy`）被创建，因此多个调用者只是读取操作时可以共享同一份资源。

> **读写锁** 的思想是：**读读共享、其他都互斥（写写互斥、读写互斥、写读互斥）**，原因是由于读操作不会修改原有的数据，因此并发读并不会有安全问题；而写操作是危险的，所以当写操作发生时，不允许有读操作加入，也不允许第二个写线程加入。
>
> `CopyOnWrite` 的思想比读写锁的思想又更进一步。为了将读取的性能发挥到极致，`CopyOnWrit` 读取是完全不用加锁的，更厉害的是，写入也不会阻塞读取操作，也就是说你可以在写入的同时进行读取，只有写入和写入之间需要进行同步，也就是不允许多个写入同时发生，但是在写入发生时允许读取同时发生。这样一来，读操作的性能就会大幅度提升。

如果简单的使用 **读写锁** 的话，在写锁被获取之后，读写线程被阻塞，只有当写锁被释放后读线程才有机会获取到锁从而读到最新的数据，**站在读线程的角度来看，读线程任何时候都是获取到的最新数据，满足数据实时性**。既然咱们说到要优化，必然要有所折衷，咱们可以通过 **牺牲数据实时性来满足数据的最终一致性**。而 `CopyOnWriteArrayList` 就是通过 `COW`（**写时复制**）的思想使用 **延时更新的策略** 来实现数据的 **最终一致性**，并且能够保证读线程之间不会有阻塞。

以上通俗理解就是，当咱们往一个容器中添加元素的时候，不直接往当前容器添加，而是 **先将当前容器进行 `copy`，复制出一个新的容器，然后将元素添加到新的容器中，添加完元素之后，再将原容器的引用指向新的容器**。这样做的好处就是可以对 `CopyOnWrite` 容器 **进行并发的读，而不需要加锁**，因为当前容器不会添加任何元素。所以 `CopyOnWrite` 容器也是一种 **读写分离** 的思想，读和写是不同的容器。**延时更新的策略** 是通过在写的时候针对不同的容器来实现的，**放弃数据实时性达到数据的最终一致性**。

## 2. 简介

咱们经常使用的 `ArrayList` 集合并 **不是线程安全的**，在遍历集合的时候如果对集合中的数据进行了修改，基于 **`fail-fast` 机制**，会 **立即抛出 `ConcurrentModificationException` 异常**。

如果想保证线程安全，可以使用 `Vector` 或者使用 `Collections` 工具类中的静态方法 `synchronizedList()` 方法将 `ArrayList` 包装成一个线程安全的类，但是这些方式都是通过 `synchronized` 关键字对方法进行修饰，利用独占锁来保证线程安全，效率很低。

Doug Lea 大师就为咱们提供了可以保证线程安全的 `CopyOnWriteArrayList` 集合。在 `CopyOnWriteArrayList` 源码上方有这样一段注释：

> A thread-safe variant of ArrayList in which all mutative operations (add, set, and so on) are implemented by making a fresh copy of the underlying array.

大致意思是：是 `ArrayList` 的线程安全变体，其中所有的可变操作（`add`、`set` 等）都是 **通过创建基础数组的新副本来实现的**。

![CopyOnWriteArrayList继承体系图.drawio](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202212030759926.png)

其定义如下所示：

```java
public class CopyOnWriteArrayList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
```

`CopyOnWriteArrayList` 同 `ArrayList` 一样实现了如下接口：

- `List` 接口，支持 `List` 集合的所有操作，如 `add()`、`remove()`、`set()`、`get()` 方法等等；
- `RandomAccess` 接口，表示支持随机访问；
- `Cloneable` 接口，表示支持克隆，其拷贝方式为 **浅拷贝**；

  ```java
  public Object clone() {
      try {
          @SuppressWarnings("unchecked")
          CopyOnWriteArrayList<E> clone =
              (CopyOnWriteArrayList<E>) super.clone();
          clone.resetLock();
          // Unlike in readObject, here we cannot visibility-piggyback on the
          // volatile write in setArray().
          VarHandle.releaseFence();
          return clone;
      } catch (CloneNotSupportedException e) {
          // this shouldn't happen, since we are Cloneable
          throw new InternalError();
      }
  }
  ```

  

- `Serializable` 接口，表示支持序列化，其内部核心字段 `array` 数组被 `transient` 关键字所修饰，为了实现自己的序列化与反序列化策略，其自定义了 `writeObject()` 和 `readObject()` 方法，这样在执行序列化和反序列化操作的时候就不是调用 `ObjectOutputStream` 和 `ObjectInputStream` 中默认的 `writeObject()` 和 `readObject()` 方法，而是使用自定义的 `writeObject()` 和 `readObject()` 方法。

  ```java
  private void writeObject(java.io.ObjectOutputStream s)
      throws java.io.IOException {
  
      s.defaultWriteObject();
  
      Object[] es = getArray();
      // Write out array length
      s.writeInt(es.length);
  
      // Write out all elements in the proper order.
      for (Object element : es)
          s.writeObject(element);
  }
  
  private void readObject(java.io.ObjectInputStream s)
      throws java.io.IOException, ClassNotFoundException {
  
      s.defaultReadObject();
  
      // bind to new lock
      resetLock();
  
      // Read in array length and allocate array
      int len = s.readInt();
      SharedSecrets.getJavaObjectInputStreamAccess().checkArray(s, Object[].class, len);
      Object[] es = new Object[len];
  
      // Read in all elements in the proper order.
      for (int i = 0; i < len; i++)
          es[i] = s.readObject();
      setArray(es);
  }
  ```

## 3. 底层实现

实际上 `CopyOnWriteArrayList` 内部维护的就是一个数组：

```java
private transient volatile Object[] array;
```

并且该数组引用被 `volatile` 关键字所修饰。关于 `volatile` 很重要的一条性质就是它能够保证线程间的 **可见性**。其中 `volatile` 关键字解释如下所示：

```ad-important
volatile （挥发物、易变的）：变量修饰符，只能用来修饰变量。volatile 修饰的成员变量在每次被线程访问时，都强迫从共享内存中重读该成员变量的值。而且，当成员变量发生变化时，强迫线程将变化值回写到共享内存。这样在任何时刻，两个不同的线程总是看到某个成员变量的同一个值。
```

## 4. 增删改查

### 4.1. 增

```java
public boolean add(E e) {
    synchronized (lock) {
        // 获取原数组引用赋值给es，即es指向原数组
        Object[] es = getArray();
        int len = es.length;
        // 创建新的数组，并将原数组中的数据复制到新数组中，es指向新数组（这里是比较耗时的操作，但不影响其它读线程）
        es = Arrays.copyOf(es, len + 1);
        // 将元素添加到新数组中
        es[len] = e;
        // 让原数组引用array指向新数组
        setArray(es);
        return true;
    }
}
```

- 上锁，保证同一时刻只有一个写线程正在进行数组的复制，否则的话内存中会有多份被复制的数据。
- 由于在写数据的时候，是在新的数组中插入数据的，从而保证读写是在两个不同的容器中进行操作。
- 前面说过数组引用 `array` 被 `volatile` 关键字所修饰，当原数组引用 `array` 指向新的数组时，写线程对数组引用的修改对读线程是立即可见的。

```java
public void add(int index, E element) {
    synchronized (lock) {
        // 获取原数组引用赋值给es，即es指向原数组
        Object[] es = getArray();
        int len = es.length;
        // 检查元素插入的位置是否在合理的范围之内
        if (index > len || index < 0)
            throw new IndexOutOfBoundsException(outOfBounds(index, len));
        Object[] newElements;
        // 计算需要移动的元素个数
        int numMoved = len - index;
        // 判断需要移动的元素个数是否为0，即判断是否是将元素添加到数组的最后
        if (numMoved == 0)
            // 条件成立，说明是将元素添加数组的末尾，创建新的数组，并将原数组中的数据复制到新数组中，newElements指向新数组
            newElements = Arrays.copyOf(es, len + 1);
        else {
            // 创建并初始化新数组，长度为原数组长度+1
            newElements = new Object[len + 1];
            // 将原数组中前半段（0~index）位置上的元素拷贝到新数组前半段（0~index）的位置上
            System.arraycopy(es, 0, newElements, 0, index);
            // 将原数组中后半段（index~+numMoved）位置上的元素拷贝到新数组后半段（index+1~+numMoved）的位置上
            // 此时新数组的index位置为空，没有填充任何元素
            System.arraycopy(es, index, newElements, index + 1,
                             numMoved);
        }
        // 添加元素
        newElements[index] = element;
        // 让原数组引用array指向新数组
        setArray(newElements);
    }
}
```

整个代码还是很容易理解的，重要的是写时复制的思想。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202212070422213.png)

### 4.2. 删

```java
public E remove(int index) {
    synchronized (lock) {
        // 获取原数组引用赋值给es，即es指向原数组
        Object[] es = getArray();
        int len = es.length;
        // 获取原数组中索引位置上的元素
        E oldValue = elementAt(es, index);
        // 计算需要移动的元素个数
        int numMoved = len - index - 1;
        Object[] newElements;
        // 判断需要移动的元素个数是否为0，即判断是否是删除数组中最后一个元素
        if (numMoved == 0)
            // 条件成立，说明是删除数组中最后一个元素，创建新的数组，并将原数组中的数据复制到新数组中，newElements指向新数组
            newElements = Arrays.copyOf(es, len - 1);
        else {
            // 创建并初始化新数组，长度为原数组长度-1
            newElements = new Object[len - 1];
            // 将原数组中前半段（0~index）位置上的元素拷贝到新数组前半段（0~index）的位置上
            System.arraycopy(es, 0, newElements, 0, index);
            // 将原数组中后半段（index+1~+numMoved）位置上的元素拷贝到新数组后半段（index~+numMoved）的位置上
            // 效果等同于将index+1位置往后的所有元素全部向前移动一位覆盖掉index位置上的元素
            System.arraycopy(es, index + 1, newElements, index, numMoved);
        }
        setArray(newElements);
        return oldValue;
    }
}
```

### 4.3. 改

```java
public E set(int index, E element) {
    synchronized (lock) {
        // 获取原数组引用赋值给es，即es指向原数组
        Object[] es = getArray();
        // 获取原数组中索引位置上的元素
        E oldValue = elementAt(es, index);
		// 判断原数组中索引位置的元素是否与要准备进行覆盖的元素不相等
        if (oldValue != element) {
            // 条件成立，说明两个元素不相等，es指向拷贝的新数组
            es = es.clone();
            // 赋值
            es[index] = element;
        }
        // Ensure volatile write semantics even when oldvalue == element
        // 让原数组引用array指向新数组，即使 oldvalue == element 的情况下
        setArray(es);
        return oldValue;
    }
}
```

以上三个方法的步骤非常类似，都是先上锁，再拷贝一份新的数组，在新的数组上进行修改，修改完成之后，再让原数组引用指向新数组，从而到达修改的目的。

### 4.4. 查

```java
public E get(int index) {
    // 直接返回对应索引位置上的元素
    return elementAt(getArray(), index);
}

static <E> E elementAt(Object[] a, int index) {
    return (E) a[index];
}
```

`get()` 方法实现非常简单，就是获取数组中索引位置上的元素。没有任何同步控制和加锁操作，原因就是所有的读线程只会读取容器中的数据，并不会进行修改，而且写线程会拷贝一份新的数组，在新数组上进行操作，因此可以保证数据安全，只是 **无法读取到最新的数据，无法保证强一致性**。

## 5. 迭代器

`CopyOnWriteArrayList` 实现了 `iterator()` 方法，返回自定义的 `Iterator` 迭代器对象。

```java
public Iterator<E> iterator() {
    return new COWIterator<E>(getArray(), 0);
}
```

该迭代器有两个非常重要的属性，分别为 `snapshot` 和 `cursor`。其中，`snapshot` 代表数组的 **快照**，也就是在创建迭代器时那个时刻的数组情况，而 `cursor` 则为迭代器的游标。

```java
static final class COWIterator<E> implements ListIterator<E> {
    /** Snapshot of the array */
    private final Object[] snapshot;
    /** Index of element to be returned by subsequent call to next.  */
    private int cursor;

    COWIterator(Object[] es, int initialCursor) {
        cursor = initialCursor;
        snapshot = es;
    }
}
```

可以看到，迭代器在被创建的时候，会把当时的 `array` 赋值给 `snapshot`，而之后迭代器中的所有操作都是基于 `snapshot` 快照进行的，所以 **在迭代期间，其他线程对原数组的修改并不会影响迭代器的执行**。并且该迭代器是只读的，因为它的 `add()`、`set()`、`remove()` 方法均直接抛出 `UnsupportedOperationException` 异常，因此在迭代过程中不支持修改操作。

## 6. 应用场景

`CopyOnWrite` 并发容器用于 **读多写少** 的并发场景。比如白名单、黑名单、国家城市等基础数据缓存、系统配置等。这些基本都是只要项目启动的时候初始化一次，变更频率非常的低。假如有一个搜索网站，用户在这个网站的搜索框中，输入关键字搜索内容，但是某些关键字不允许被搜索。这些不能被搜索的关键字会被放在一个黑名单中，黑名单每天晚上更新一次。当用户搜索时，会检查当前关键字在不在黑名单中，如果在，则提示不能搜索。

使用 `CopyOnWrite` 并发容器时需要注意以下两点：

1. **减少扩容开销**。根据实际需要，初始化 `CopyOnWrite` 并发容器的大小，避免写时扩容的开销。
2. **使用批量添加**。因为每次添加，容器每次都会进行复制，所以减少添加次数，可以减少容器的复制次数。

## 7. 优缺点

### 7.1. 优点

`CopyOnWriteArrayList` 对于数据的修改操作均是在副本上完成，并基于 `synchronized` 保证同一时间只有一个写线程能够对底层数组执行修改操作。对于 **读多写少** 的场景来说，`CopyOnWriteArrayList` 能够 **在保证线程安全的同时媲美 `ArrayList` 的性能**。

### 7.2. 缺点

如果在实际业务中使用 `CopyOnWrite` 并发容器，一定是因为这个场景适合而非是为了炫技。

#### 7.2.1. 内存占用问题

因为 `CopyOnWrite` 的 **写时复制机制** 每次进行写操作的时候都会有两个数组对象的内存，如果这个数组对象占用的内存较大的话，如果频繁的进行写入就会造成频繁的 Yong GC 和 Full GC。

#### 7.2.2. 数据一致性问题

`CopyOnWrite` 容器 **只能保证数据的最终一致性，不能保证数据的实时一致性**。读操作的线程可能不会立即读取到新修改的数据，因为修改操作发生在副本上。但最终修改操作会完成并更新容器所以这是最终一致性。