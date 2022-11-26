---
title: ArrayList 源码分析
tags: 
  - 集合
  - 源码
created: 2022-11-25 13:35:47
modified: 2022-11-25 13:35:47
number headings: auto, first-level 1, max 6, _.1.1.
---

# ArrayList 源码分析

## 1. 底层实现

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211251445395.png)

`ArrayList` 实现了 `List` 接口，继承自 `AbstractList` 抽象类。**底层是基于数组实现的**，并且实现了 **动态扩容**。

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211251435849.png)

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
{
    private static final int DEFAULT_CAPACITY = 10;
    transient Object[] elementData;
    private int size;
}
```

`ArrayList` 还实现了 `RandomAccess` 接口，这是一个标记接口：

```java
public interface RandomAccess {
}
```

内部是空的，标记”实现了这个接口的类支持快速（通常是固定时间）随机访问“。快速随机访问是什么意思呢？就是说 **不需要遍历，就可以通过下标（索引）直接访问到内存地址**。

```java
public E get(int index) {
    Objects.checkIndex(index, size);
    return elementData(index);
}
E elementData(int index) {
    return (E) elementData[index];
}
```

`ArrayList` 还实现了 `Cloneable` 接口，这表明 `ArrayList` 是支持拷贝的。`ArrayList` 内部也的确重写了 `Object` 类中的 `clone()` 方法。

```java
public Object clone() {
    try {
        ArrayList<?> v = (ArrayList<?>) super.clone();
        v.elementData = Arrays.copyOf(elementData, size);
        v.modCount = 0;
        return v;
    } catch (CloneNotSupportedException e) {
        // this shouldn't happen, since we are Cloneable
        throw new InternalError(e);
    }
}
```

`ArrayList` 还实现了 `Serializable` 接口，同样是一个标记接口：

```java
public interface Serializable {
}
```

内部也是空的，标记”实现了这个接口的类支持序列化“。序列化是什么意思呢？Java 的序列化是指，将对象转换成以字节序列的形式来表示，这些字节序列中包含了对象的字段和方法。序列化后的对象可以被写到数据库、文件中，也可以用于网络传输。

眼睛尖的小伙伴可能会注意到，`ArrayList` 中的关键字段 `elementData` 使用了 **`transient` 关键字** 修饰，这个关键字的作用是，**让它修饰的字段不被序列化**。这不是前后矛盾吗？一个类既然实现了 `Serializable` 接口，肯定是想要被序列化的，对吧？那为什么保存关键数据的 `elementData` 又不想被序列化呢？

这个还得从“`ArrayList` 是基于数组实现的”开始说起。小伙伴们都知道，数组是定长的，就是说，数组一旦声明了，长度（容量）就是固定的，不能像某些东西一样伸缩自如。这就很麻烦，数组一旦装满了，就不能添加新的元素进来了。

`ArrayList` 不能像数组这样活着，它想能屈能伸，所以它实现了 **动态扩容**。**一旦在添加元素的时候，发现容量用满了 `size == elementData.length`，就按照原来数组的 1.5 倍（`oldCapacity + oldCapacity >> 1`）进行扩容。扩容之后，再将原有的数组复制到新分配的内存地址上 `Arrays.copyOf(elementData, newCapacity)`**。

```java
private void add(E e, Object[] elementData, int s) {
    if (s == elementData.length)
        elementData = grow();
    elementData[s] = e;
    size = s + 1;
}

private Object[] grow() {
    return grow(size + 1);
}

private Object[] grow(int minCapacity) {
    int oldCapacity = elementData.length;
    if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                oldCapacity >> 1           /* preferred growth */);
        return elementData = Arrays.copyOf(elementData, newCapacity);
    } else {
        return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
    }
}
```

动态扩容意味着什么？意味着数组的实际大小可能永远无法被填满，总有多余空置的内存空间。

比如说，默认的数组大小是 10，当添加第 11 个元素的时候，数组的长度扩容了 1.5 倍，也就是 15，意味着还有 4 个位置空着，对吧？

序列化的时候，如果把整个数组都序列化的话，是不是就多序列化了 4 个内存空间。当存储的元素数量非常非常多的时候，闲置的空间就非常非常大，序列化耗费的时间就会非常非常长。于是，`ArrayList` 做了一个愉快而又聪明的决定，内部提供了两个私有方法 `writeObject()` 和 `readObject()` 来完成序列化和反序列化。

```java
private void writeObject(java.io.ObjectOutputStream s)
        throws java.io.IOException {
    // Write out element count, and any hidden stuff
    int expectedModCount = modCount;
    s.defaultWriteObject();

    // Write out size as capacity for behavioral compatibility with clone()
    s.writeInt(size);

    // Write out all elements in the proper order.
    for (int i=0; i<size; i++) {
        s.writeObject(elementData[i]);
    }

    if (modCount != expectedModCount) {
        throw new ConcurrentModificationException();
    }
}
```

从 `writeObject()` 方法的源码中可以看得出，它使用了 `ArrayList` 的实际大小 `size` 而不是数组的长度 `elementData.length` 来作为元素的上限进行序列化。

此处应该有掌声！👏👏👏为 Java 源码的作者们，他们真的是太厉害了，可以用两个词来形容它们 - 殚精竭虑、精益求精。

## 2. 初始化

```java
List<String> list = new ArrayList<String>(10);

public ArrayList() {
    this.elementData = DEFAULTCAPACITY_EMPTY_ELEMENTDATA;
}

 /**
  * Constructs an empty list with the specified initial capacity.
  *
  * @param  initialCapacity  the initial capacity of the list
  * @throws IllegalArgumentException if the specified initial capacity
  *         is negative
  */
 public ArrayList(int initialCapacity) {
     if (initialCapacity > 0) {
         this.elementData = new Object[initialCapacity];
     } else if (initialCapacity == 0) {
         this.elementData = EMPTY_ELEMENTDATA;
     } else {
         throw new IllegalArgumentException("Illegal Capacity: "+
                                            initialCapacity);
     }
 }
```

- 通常情况下，空构造函数初始化 `ArrayList` 更加常用，这种方式数组的长度会在第一次插入数据时进行扩容时设置，为默认的数组长度 `DEFAULT_CAPACITY = 10`。
- 数组进行扩容时，需要将原数组中的元素重新拷贝一份到新数组中，这种操作的代价是很高的。所以当咱们已经知道要填充多少个元素到 `ArrayList` 中，为了提升性能，请直接初始化一个预先设定好的长度。
- 另外，`EMPTY_ELEMENTDATA` 是一个定义好的空对象：`private static final Object[] EMPTY_ELEMENTDATA = {}`

## 3. 插入

`ArrayList` 对元素的插入，其实就是对数组的操作，只不过需要特定时候扩容。

`ArrayList` 新增元素有两种情况，一种是直接将元素 **添加到数组末尾**，一种是将元素 **插入到指定位置**。

### 3.1. 添加到数组末尾

```java
List<String> list = new ArrayList<>();
list.add("aaa");
list.add("bbb");
list.add("ccc");
```

当我们依次插入添加元素时，`add()` 方法只是把元素记录到数组的各个位置上，源码如下：

```java
/**
 * Appends the specified element to the end of this list.
 *
 * @param e element to be appended to this list
 * @return <tt>true</tt> (as specified by {@link Collection#add})
 */
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Increments modCount!!
    elementData[size++] = e;
    return true;
}
```

- 这是插入元素时的源码，`size++` 自增，把对应元素添加进去。

### 3.2. 插入时扩容

在前面 `初始化` 部分讲到，`ArrayList` 默认初始化时会申请 10 个长度的空间，如果超过这个长度则需要进行扩容，那么它是怎么扩容的呢？

从根本上分析来说，**数组是定长的，如果超过原来定长长度，扩容则需要申请新的数组长度，并把原数组中的所有元素拷贝到新数组中**，如下图：

![数组扩容](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211261058322.png)

图中介绍了当 `ArrayList` 可用空间长度不足时则需要进行扩容，这主要包括如下步骤：

1. 判断长度充足：`ensureCapacityInternal(size + 1);`
2. 当长度不足时，则通过扩大函数 `grow(int minCapacity)` 进行扩容
3. 扩容的长度计算：`int newCapacity = oldCapacity + (oldCapacity >> 1);`，旧容量 + 旧容量右移 1 位，这相当于扩容为原来容量的 `(int)3/2`。如，当数组长度为 10 时，10 转换成二进制为 1010，则 1010 + 1010 >> 1 = 1010 + 0101 = 10 + 5 = 15。
4. 当扩容完之后，就需要把原数组中的数据拷贝到新数组中，这个过程会用到 `Arrays.copyOf(elementData, newCapacity);`，底层使用的是 `System.arraycopy()` 方法。

   ```java
   @Test
   public void test_arraycopy() {
       int[] oldArr = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
       int[] newArr = new int[oldArr.length + (oldArr.length >> 1)];
       System.arraycopy(oldArr, 0, newArr, 0, oldArr.length);
       
       newArr[11] = 11;
       newArr[12] = 12;
       newArr[13] = 13;
       newArr[14] = 14;
       
       System.out.println("数组元素：" + JSON.toJSONString(newArr));
       System.out.println("数组长度：" + newArr.length);
       
       /**
        * 测试结果
        * 
        * 数组元素：[1,2,3,4,5,6,7,8,9,10,0,11,12,13,14]
        * 数组长度：15
        */
   }
   ```

   - 拷贝数组的过程并不复杂，主要是对 `System.arraycopy()` 方法的操作。
   - 上面就是把 `oldArr` 拷贝到 `newArr`，同时新数组的长度，采用和 `ArrayList` 一样的计算逻辑；`oldArr.length + (oldArr.length >> 1)`

### 3.3. 插入到指定位置

```java
public static void main(String[] args) {
    List<String> list = new ArrayList<>(10);
    list.add(2, "1");
    System.out.println(list.get(0));
}
```

上面这段代码的输出结果是什么？其实这样会报错！如下：

```java
Exception in thread "main" java.lang.IndexOutOfBoundsException: Index: 2, Size: 0
	at java.util.ArrayList.rangeCheckForAdd(ArrayList.java:665)
	at java.util.ArrayList.add(ArrayList.java:477)
	at org.itstack.interview.test.ApiTest.main(ApiTest.java:14)
```

为什么会这样呢？咱们翻开下源码学习下。

#### 3.3.1. 容量验证

```java
public void add(int index, E element) {
    rangeCheckForAdd(index);
    
    ...
}

private void rangeCheckForAdd(int index) {
    if (index > size || index < 0)
        throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
}
```

- 插入指定位置时首先要使用 `rangeCheckForAdd()` 方法判断要插入位置与 `size` 的长度。
- 通过上面的元素插入咱们知道，每插入一个元素，`size++`。
- 所以即使咱们申请了 10 个容量长度的 `ArrayList`，但是插入指定位置时会判断元素插入位置 `index` 是否大于 `size`，如果大于的话则会抛出 `IndexOutOfBoundsException` 异常。

#### 3.3.2. 元素迁移

![插入元素迁移](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211261416749.png)

插入指定位置的核心步骤包括：

1. 判断 `size` 大小，是否可以插入。
2. 判断插入后是否需要扩容：`ensureCapacityInternal(size + 1);`。
3. 数组元素迁移，把从待插入位置之后的所有元素顺序向后移动。
4. 给数组指定位置赋值，也就是把待插入元素插入进来。

**部分源码：**

```java
public void add(int index, E element) {
	...
	// 判断是否需要扩容以及扩容操作
	ensureCapacityInternal(size + 1);
    // 数据拷贝迁移，把待插入位置空出来
    // elementData:源数组；index:源数组中的起始位置；elementData：目标数组；index + 1：目标数组中的起始位置；size - index：要复制的数组元素的数量；
    System.arraycopy(elementData, index, elementData, index + 1, size - index);
    // 数据插入操作                  
    elementData[index] = element;
    size++;
}
```

- 这部分源码的主要核心是在 `System.arraycopy()` 方法，在上面咱们已经演示过相应的操作方式。
- 这里只是设定了指定位置的迁移，可以把上面的案例代码复制下来做测试验证。

**实际：**

```java
List<String> list = new ArrayList<String>(Collections.nCopies(9, "a"));
System.out.println("初始化：" + list);

list.add(2, "b");
System.out.println("插入后：" + list);
```

**测试结果：**

```java
初始化：[a, a, a, a, a, a, a, a, a]
插入后：[a, a, b, a, a, a, a, a, a, a]

Process finished with exit code 0
```

- 已经将元素 `b` 插入到指定位置，后面的元素全部向后移动。

## 4. 删除

有了将元素插入到指定位置的经验，理解删除的过程就比较容易了，如下图所示：

![删除元素](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211261431384.png)

这里咱们结合着源码：

```java
public E remove(int index) {
    rangeCheck(index);
    modCount++;
    E oldValue = elementData(index);
    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index, numMoved);
    elementData[--size] = null; // clear to let GC do its work
    return oldValue;
}
```

删除的过程主要包括：

1. 检查是否越界：`rangeCheck(index);`
2. 计算删除元素时要移动的元素个数 `numMoved`，并通过 `System.arraycopy()` 方法将 `index + 1` 之后的元素复制给原数组 `index` 往后的位置，相当于将 `index` 之后的元素全部往前移动一位，即覆盖掉 `index` 位置原来的元素，从而到达删除的目的。
3. 把最后一个元素清空，`null`。

**这里咱们做个例子：**

```java
@Test
public void test_copy_remove() {
    int[] oldArr = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int index = 2;
    int numMoved = 10 - index - 1;
    System.arraycopy(oldArr, index + 1, oldArr, index, numMoved);
    System.out.println("数组元素：" + JSON.toJSONString(oldArr));
}
```

- 设定一个拥有 10 个元素的数组，同样按照 `ArrayList` 的规则进行移动元素。
- 注意，为了方便观察结果，这里没有把结尾元素设置为 `null`。

**测试结果：**

```java
数组元素：[1,2,4,5,6,7,8,9,10,10]

Process finished with exit code 0
```

- 这里可以看到指定位置 `index = 2` 的元素已经被删除掉。
- 同时数组已经移动，用元素 `4` 占据了元素 `3` 的位置，依次类推，同时数组最后一个元素 `10` 还等待清空。这也就是为什么 `ArrayList` 源码中存在这样一行代码：`elementData[--size] = null;`。