---
title: Spring-IOC
tags:
  - spring
  - ioc
created: 2022-08-23 14:52:50
modified: 2022-09-18 15:48:17
number headings: auto, first-level 1, max 6, 1.1.
---

# Spring-IOC模块

> 本章节所涉及到的代码在 [GitHub - xihuanxiaorang/spring-study: 用于spring学习](https://github.com/xihuanxiaorang/spring-study) 仓库中的 `ioc` 模块，可以自行查看。

## 1.1. 环境搭建

开发环境：

```markdown
1. JDK1.8+
2. Maven 3.5+
3. SpringFramework 5.1.4
```

依赖的 jar 包：

```xml
<dependencies>
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.13.2</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>5.3.16</version>
    </dependency>
</dependencies>
```

Spring 的配置文件：<br/>![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120105889.png)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

</beans>
```

## 1.2. Spring 核心 API

ApplicationContext：是一个接口，主要用于对象的创建。其实现类主要有 `ClassPathXmlApplicationContext` 和 `XmlWebApplicationContext`。ApplicationContext 工厂对象占用大量内存，一个应用中只会有一个工厂对象 (单例)，并且是线程安全的。<br />![|600](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120109870.png)

## 1.3. 程序开发

```markdown
1. 创建需要Spring进行管理的类
2. 配置配置文件 <bean id="person" class="xxx.basic.person" /> 
3. 编写测试类，从工厂中获取对象
   ApplicationContext
       |- ClassPathXmlApplicationContext
   ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
   Person person = ctx.getBean("person", Person.class);
```

### 1.3.1. 编写 Person 类

```java
public class Person {
  private String name;
  private Integer age;

  private Person() {
    System.out.println("Person类构造方法");
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    this.age = age;
  }
}
```

### 1.3.2. 编写配置文件

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person" />
```

### 1.3.3. 编写测试方法

```java
@Test
public void test1() {
    ApplicationContext applicationContext =
        new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = applicationContext.getBean("person", Person.class);
    System.out.println(person);
}
```

📝可以看到构造方法被调用。<br />

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120110397.png) <br />💡注意<br />当没有在 `applicationContext.xml` 文件中注册 `Person` 类时，从工厂中获取该类对象会报如下错误。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120111807.png)

## 1.4. 细节分析

- spring 工厂创建的对象叫做 bean 或者组件 (component)
- spring 工厂的相关方法

```java
Person person = applicationContext.getBean("person", Person.class);
System.out.println(person);
// 没有指定类型，返回值需要进行强转
Person person1 = (Person) applicationContext.getBean("person");
System.out.println(person1);
// 使用该方法时，在spring配置文件中只能有一个class是Person的bean，否则会报错
Person person2 = applicationContext.getBean(Person.class);
System.out.println(person2);
// 获取spring配置文件中所有bean表标签的id
String[] beanDefinitionNames = ctx.getBeanDefinitionNames();
for (String beanDefinitionName : beanDefinitionNames) {
  System.out.println(beanDefinitionName);
}
// 用于判断是否存在指定id或者name值的bean
System.out.println(ctx.containsBean("person"));
// 用于判断是否存在指定id值的bean
System.out.println(ctx.containsBeanDefinition("person"));
```

💡注意

1. 当使用 `applicationContext.getBean(xxx.class)` 方法获取对象的时候，如果 spring 配置中有两个 bean 的 class 都是 xxx，则会报如下错误。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120111711.png)
2. 当在 spring 配置文件中注册 bean 时，bean 标签里只有 class，没有 id 值，那么它默认的 id 值是 `全限定类名#0`。如 `<bean class="top.xiaorang.basic.Person" />`，那么 id 值为 `top.xiaorang.basic.Person#0`。如果这个 bean 只需要使用一次，那么可以省略 id 值，如果在其他 bean 中会引用到这个 bean，这个时候就需要设置 id 值。
2. bean 标签中的 name 属性，为 bean 对象定义别名，在获取对象的时候也可以通过别名来获取。

区别 (与 id 属性)：

   - 别名可以定义多个 (用逗号分隔)，但是 id 属性只能有一个值
   - id 属性值，命名要求：必须以字母开头，可以使用字母，数字，下划线，连字符等符号，不可以以特殊字符开头/person，虽然发展到现在 id 就像 name 一样没有了命名的限制。
4. 获取出来的对象是单例的。如下图，三种获取 person 对象的方式打印出来的对象引用都是一样的，说明获取到的对象都是同一个。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120112307.png)

## 1.5. 代码分析

1. `ClassPathXmlApplicationContext` 工厂读取 `applicationContext.xml` 配置文件。
1. 获得 bean 标签的相关信息，id 值为 "person"，class 值为 "top.xiaorang.spring.basic.Person"，通过反射去调用 Person 类的构造方法创建对象。即使构造方法是私有的，也可以创建出来对象。

```java
Class clazz = Class.forName(class的值);
id的值 = Clazz.newInstance();
```

# 2. 整合日志框架

## 2.1. 为什么要整合日志框架？🤔

`spring` 与日志框架进行整合，利用日志框架可以输出 spring 框架在运行过程中的一些重要信息，便于了解 `spring` 框架的运行过程。  

## 2.2. 如何整合

引入依赖

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-log4j12</artifactId>
    <version>1.7.25</version>
</dependency>
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
```

编写配置文件

```properties
# resources文件夹根目录下
### 配置根
log4j.rootLogger=debug,console
### 日志输出到控制台显示
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.Target=System.out
log4j.appender.console.layout=org.apache.log4j.PatternLayout
log4j.appender.console.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} %-5p %c{1}:%L - %m%n
```

## 2.3. 测试

```java
@Test
public void test1() {
    ApplicationContext applicationContext =
        new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = applicationContext.getBean("person", Person.class);
    System.out.println(person);
}
```

观察控制台，发现已经打印 `spring` 运行过程中的相关日志。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120112197.png)

# 3. 依赖注入 (Dependcy Injection)

## 3.1. 什么是依赖注入

通过 `spring` 工厂以及配置文件为所创建的对象的成员变量赋值。  

## 3.2. 为什么需要依赖注入

通过编码的方式给成员变量赋值，存在耦合，以后维护代码需要修改源码，如果使用依赖注入的方式，代码不需要修改，只需要修改配置文件中的值即可，这样的话可以做到解耦合。  

## 3.3. 程序开发

### 3.3.1. 编写 Person 类

类还是以前的 `Person` 类，里面有两个属性 `name` 和 `age`，书写 `getter` `setter` 方法

```java
public class Person {
  private String name;
  private Integer age;

  private Person() {
    System.out.println("Person类构造方法");
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    System.out.println("name=" + name);
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    System.out.println("age=" + age);
    this.age = age;
  }

  @Override
  public String toString() {
    return "Person{" + "name='" + name + '\'' + ", age=" + age + '}';
  }
}
```

### 3.3.2. 编写配置文件

在配置文件声明 `Person` 类的 `bean` 标签中使用 `property` 标签给类中的成员变量进行赋值。

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person">
    <property name="name" value="小让"/>
    <property name="age" value="10"/>
</bean>
```

### 3.3.3. 编写测试类

```java
@Test
public void test1() {
    ApplicationContext applicationContext =
        new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = applicationContext.getBean("person", Person.class);
    System.out.println(person);
}
```

发现打印出来的对象中，`name` 和 `age` 属性已经被赋值。  

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120112371.png)

## 3.4. 代码分析

通过上面的代码以及输出结果，可以看出 `spring` 底层通过反射调用对象的构造方法创建出对象，之后调用对象的 `setter` 方法给成员变量赋值，这种赋值方式称之为 set 注入。  

# 4. set 注入详解

针对不同类型的成员变量，在 `property` 标签中需要嵌套其他标签才能给成员变量赋值。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120113374.png)

## 4.1. JDK 内置类型

常见的成员变量类型有①8 种基本类型 +String②数组类型③set 集合④list 集合⑤Map 集合⑥Properties 集合  

### 4.1.1. 种基本类型 +String

`property` 标签嵌套 `value` 标签。

```xml
<property>
  <value></value>
</property>
```

### 4.1.2. 数组

`property` 标签嵌套 `array` 标签。

```xml
<property>
  <array>
    <value></value>
    <value></value>
  </array>
</property>
```

### 4.1.3. set 集合

`property` 标签嵌套 `set` 标签。

```xml
<property>
  <set>
    <value></value>
    <value></value>
  </set>
</property>
```

### 4.1.4. list 集合

`property` 标签嵌套 `list` 标签。

```xml
<property>
  <list>
    <value></value>
    <value></value>
  </list>
</property>
```

### 4.1.5. Map 集合

`property` 标签嵌套 `map` 标签，`map` 标签再嵌套 `entry` 标签。其中，key 有特定的 `key` 标签，值根据对应类型选择标签。

```xml
<property>
  <map>
    <entry>
      <key>
          <value></value>
      </key>
      <value></value>
    </entry>
    <entry key="" value=""/>
  </map>
</property>
```

### 4.1.6. Propties 集合

`property` 标签嵌套 `props` 标签，`props` 标签嵌套 `prop` 标签。

```xml
<property>
    <props>
        <prop key=""></prop>
        <prop key=""></prop>
    </props>
</property>
```

### 4.1.7. 复杂的 JDK 类型 (Date)

spring 提供的默认的日期类型格式为 2022/03/17，如果你的日期格式为 2022-03-17 的话，spring 不支持，则需要自定义类型转换器。后续在将自定义类型转换器的时候会详细解释。  

### 4.1.8. 测试

#### 4.1.8.1. 编写 Customer 类

```java
public class Customer implements Serializable {
  private String name;
  private Integer age;
  private String[] emails;
  private Set<String> tels;
  private List<String> addresses;
  private Map<String, String> qqs;
  private Properties p;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    this.age = age;
  }

  public String[] getEmails() {
    return emails;
  }

  public void setEmails(String[] emails) {
    this.emails = emails;
  }

  public Set<String> getTels() {
    return tels;
  }

  public void setTels(Set<String> tels) {
    this.tels = tels;
  }

  public List<String> getAddresses() {
    return addresses;
  }

  public void setAddresses(List<String> addresses) {
    this.addresses = addresses;
  }

  public Map<String, String> getQqs() {
    return qqs;
  }

  public void setQqs(Map<String, String> qqs) {
    this.qqs = qqs;
  }

  public Properties getP() {
    return p;
  }

  public void setP(Properties p) {
    this.p = p;
  }

  @Override
  public String toString() {
    return "Customer{" +
            "name='" + name + '\'' +
            ", age=" + age +
            ", emails=" + Arrays.toString(emails) +
            ", tels=" + tels +
            ", addresses=" + addresses +
            ", qqs=" + qqs +
            ", p=" + p +
            '}';
  }
}
```

#### 4.1.8.2. 编写配置文件，给成员变量赋值

```xml
<bean id="customer" class="top.xiaorang.spring.basic.Customer">
  <property name="name" value="小明"/>
  <property name="age" value="18"/>
  <property name="emails">
      <array>
          <value>15019474951@163.com</value>
          <value>623052545@qq.com</value>
          <value>2329862718@qq.com</value>
      </array>
  </property>
  <property name="tels">
      <set>
          <value>15019474951</value>
          <value>13838384388</value>
          <value>18274831189</value>
      </set>
  </property>
  <property name="addresses">
      <list>
          <value>珠光村东区91栋413</value>
          <value>龙胜一小队xxx栋605</value>
      </list>
  </property>
  <property name="qqs">
      <map>
          <entry>
              <key>
                  <value>xiaorang</value>
              </key>
              <value>2329862718</value>
          </entry>
          <entry key="sanshi" value="623052545"/>
      </map>
  </property>
  <property name="p">
      <props>
          <prop key="birthday">1995-07-13</prop>
          <prop key="high">168</prop>
      </props>
  </property>
</bean>
```

#### 4.1.8.3. 测试

```java
@Test
public void test3() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Customer customer = ctx.getBean("customer", Customer.class);
    System.out.println(customer);
}
```

可以看到所有成员变量均被赋值。

  ![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120114741.png)

## 4.2. 自定义类型 (用户创建的类)

当类中的成员变量是自定义类型的时候 (即程序员自己创建的类)，给成员变量赋值可以使用 `property` 嵌套 `bean` 标签。

```xml
<bean id="userService" class="top.xiaorang.spring.basic.UserServiceImpl">
    <property name="userDao">
        <bean class="top.xiaorang.spring.basic.UserDaoImpl"/>
    </property>
</bean>
```

上面这种注入方式虽然运行的结果没有问题，但实际上被注入的 UserDao 对象多次创建，造成资源的浪费。<br />正确的做法是使用 `bean` 标签创建一个 `UserDao` 对象，然后在给 `UserService` 对象中的 `userDao` 成员变量赋值时应该去引用已经创建的 `UserDao` 对象。

```xml
<bean id="userDao" class="top.xiaorang.spring.basic.UserDaoImpl"/>

<bean id="userService" class="top.xiaorang.spring.basic.UserServiceImpl">
    <property name="userDao">
        <ref bean="userDao" />
    </property>
</bean>
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120114634.png)  

## 4.3. set 注入的简化写法

### 4.3.1. 基于属性简化

```xml
<property name="">
  <value></value>
</property>
<!- 注意,value属性只能简化8种基本类型+String,其实细心的童鞋已经发现上面我已经用了简化的方式😁--->
<property name="" value=""/>

<property name="">
  <ref bean="" />
</property>
<!---------->
<property name="" ref=""/>
```

### 4.3.2. 基于 p 命名空间简化

```xml
<bean id="" class="">
  <property>
    <value></value>
  </property>
</bean>
<!--只能简化8种基本类型+String--->
<bean id="" class="" p:xxx=""/>

<bean id="" class="">
  <property name="">
    <ref bean="" />
  </property>
</bean>
<!--------------------->
<bean id="" class="" p:xxx-ref=""/>
```

# 5. 构造注入

```markdown
- 注入：通过spring配置给对象的成员变量赋值
- set注入：sprin创建完对象后，通过配置文件使用set方法给对象的成员变量赋值
- 构造注入：spring通过构造方法创建对象的同时给成员变量赋值
```

## 5.1. 开发步骤

### 5.1.1. 编写 Person 类，提供有参构造

```java
public class Person {
  private String name;
  private Integer age;

  private Person() {
    System.out.println("Person类私有构造方法");
  }

  public Person(String name, Integer age) {
    System.out.println("Person类全参构造方法");
    this.name = name;
    this.age = age;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    System.out.println("name=" + name);
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    System.out.println("age=" + age);
    this.age = age;
  }

  @Override
  public String toString() {
    return "Person{" + "name='" + name + '\'' + ", age=" + age + '}';
  }
}
```

### 5.1.2. 编写配置文件

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person">
    <constructor-arg name="name" value="小让"/>
    <constructor-arg name="age" value="10"/>
</bean>
```

### 5.1.3. 测试

```java
@Test
public void test1() {
    ApplicationContext applicationContext =
        new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = applicationContext.getBean("person", Person.class);
    System.out.println(person);
}
```

发现调用的 Person 类的全参构造方法，没有调用无参构造，并且成员变量 `name` 和 `age` 已被赋值。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120115487.png)  

## 5.2. 构造方法重载

### 5.2.1. 参数个数不同时

通过嵌套的 `constructor-arg` 标签数量即可区分。  

### 5.2.2. 构造参数个数相同时

通过 `constructor-arg` 标签中的 `name` 属性进行区分。  

## 5.3. 总结

  ![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120115582.png)

# 6. 控制反转与依赖注入

## 6.1. IOC(控制反转)

把对对象创建的控制权交给 spring 管理。  

## 6.2. DI(依赖注入)

依赖注入：当一个类需要另一个类的时候，就意味着依赖，一旦出现依赖，就可以把另一个类作为本类的成员变量，最终通过 `spring` 配置文件进行注入 (即对成员变量赋值)，这样可以做到解耦合。  

# 7. 创建复杂对象

## 7.1. 什么叫简单对象，复杂对象？

  ![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120115605.png)

## 7.2. Spring 工厂创建复杂对象的 3 种方式

### 7.2.1. 实现 FactoryBean 接口

#### 7.2.1.1. 编写 ConnectionFactoryBean 类，实现 FactoryBean 接口

```java
public class ConnectionFactoryBean implements FactoryBean<Connection> {
  private String driverClassName;
  private String url;
  private String username;
  private String password;

  @Override
  public Connection getObject() throws Exception {
    Class.forName(driverClassName);
    return DriverManager.getConnection(url, username, password);
  }

  @Override
  public Class<?> getObjectType() {
    return Connection.class;
  }

  @Override
  public boolean isSingleton() {
    return false;
  }

  public String getDriverClassName() {
    return driverClassName;
  }

  public void setDriverClassName(String driverClassName) {
    this.driverClassName = driverClassName;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
```

#### 7.2.1.2. 编写配置文件

```xml
<bean id="connection" class="top.xiaorang.spring.factorybean.ConnectionFactoryBean">
    <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/>
    <property name="url"
              value="jdbc:mysql://localhost:3306/atguigudb?useUnicode=true&amp;characterEncoding=utf-8&amp;useSSL=false&amp;serverTimezone=Asia/Shanghai"/>
    <property name="username" value="root"/>
    <property name="password" value=""/>
</bean>
```

#### 7.2.1.3. 测试

```java
@Test
public void test5() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Connection connection = ctx.getBean("connection", Connection.class);
    System.out.println(connection);
    Connection connection1 = ctx.getBean("connection", Connection.class);
    System.out.println(connection1);
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120116982.png)

#### 7.2.1.4. 代码分析

1. 在使用 `getBean` 方法获取简单对象时，获取到的都是 `bean` 标签中 `class` 属性对应的类的对象；在使用 `getBean` 获取复杂对象 (实现了 `FactoryBean` 接口) 时，获取到的是 `bean` 标签中 `class` 属性对应的类的对象中 `getObject` 方法返回的对象。
1. 其中的 `isSingleton` 方法返回 true 表示创建的是一个单例对象，只会创建一次；如果返回的是 false，则每一次都会创建一个新的对象。此处的数据库连接对象 (connection) 则返回 false，在使用的时候都应该每次获取一个新的对象。
1. 现在使用 `ctx.getBean("connection")` 获取到的 `getObject` 方法中返回的对象，如果就是想获取 `FactoryBean` 接口的实现类呢？那么需要使用 `ctx.getBean("&connection")`，获取到的就是 `ConnectionFactoryBean` 对象。  

#### 7.2.1.5. 总结

`spring` 获取到 `ConnectionFactoryBean` 对象，通过 `instanceof` 判断是 `FactoryBean` 接口的实现类，进而返回 `getObject` 方法中返回的对象。<br />使用该方式创建复杂对象，是 `spring` 原生提供的，后续在 `spring` 整合其他框架时，会大量的应用到 `FactoryBean`。  

#### 7.2.1.6. 实例工厂的方式

##### 7.2.1.6.1. 编写 ConnectionFactory 类

```java
public class ConnectionFactory {
  private String driverClassName;
  private String url;
  private String username;
  private String password;

  public Connection getConnection() {
    Connection connection = null;
    try {
      Class.forName(driverClassName);
      connection = DriverManager.getConnection(url, username, password);
    } catch (SQLException | ClassNotFoundException e) {
      e.printStackTrace();
    }
    return connection;
  }

  public String getDriverClassName() {
    return driverClassName;
  }

  public void setDriverClassName(String driverClassName) {
    this.driverClassName = driverClassName;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }
}
```

##### 7.2.1.6.2. 编写配置文件

```xml
<bean id="connectionFactory" class="top.xiaorang.spring.factory.ConnectionFactory">
    <property name="driverClassName" value="com.mysql.cj.jdbc.Driver"/>
    <property name="url"
              value="jdbc:mysql://localhost:3306/atguigudb?useUnicode=true&amp;characterEncoding=utf-8&amp;useSSL=false&amp;serverTimezone=Asia/Shanghai"/>
    <property name="username" value="root"/>
    <property name="password" value=""/>
</bean>
<bean id="connection" factory-bean="connectionFactory" factory-method="getConnection"/>
```

##### 7.2.1.6.3. 测试

```java
@Test
public void test5() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Connection connection = ctx.getBean("connection", Connection.class);
    System.out.println(connection);
    Connection connection1 = ctx.getBean("connection", Connection.class);
    System.out.println(connection1);
}
```

可以看到获取出来的 `connection` 是同一个，所以该方式创建出来的对象是单例的。并且创建了 `ConnectioFactory` 单例对象。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120116494.png)  

#### 7.2.1.7. 静态工厂的方式

##### 7.2.1.7.1. 编写 StaticConnectionFactory 类

```java
public class StaticConnectionFactory {
  private static final String DRIVER_CLASS_NAME = "com.mysql.cj.jdbc.Driver";
  private static final String URL =
      "jdbc:mysql://localhost:3306/atguigudb?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai";
  private static final String USERNAME = "root";
  private static final String PASSWORD = "";

  private StaticConnectionFactory() {}

  public static Connection getConnection() {
    Connection connection = null;
    try {
      Class.forName(DRIVER_CLASS_NAME);
      connection = DriverManager.getConnection(URL, USERNAME, PASSWORD);
    } catch (SQLException | ClassNotFoundException e) {
      e.printStackTrace();
    }
    return connection;
  }
}
```

##### 7.2.1.7.2. 编写配置文件

```xml
<bean id="connection" class="top.xiaorang.spring.staticfactory.StaticConnectionFactory"
          factory-method="getConnection"/>
```

##### 7.2.1.7.3. 测试

```java
@Test
public void test5() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Connection connection = ctx.getBean("connection", Connection.class);
    System.out.println(connection);
    Connection connection1 = ctx.getBean("connection", Connection.class);
    System.out.println(connection1);
}
```

###### 7.2.1.7.3.1. 

可以看到获取出来的 `connection` 是同一个，所以该方式创建出来的对象是单例的。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120117824.png)  

## 7.3. 总结

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120117280.png)  

# 8. 控制 spring 工厂创建对象的次数

## 8.1. 为什么要控制创建对象的次数？

因为有的对象开销比较大，创建多个容易造成内存资源的浪费。  

## 8.2. 什么样的对象只创建一次，什么样的对象需要每次创建新的？

创建一次的对象，如 `SqlSessionFactroy` `Service` `Dao`。<br />创建多次的对象，如 `Connection` `SqlSession`，因为每次控制事务时不一样，所以需要新的。<br />总结：可以共用，并且线程安全的，就可以只需要创建一次，反之则需要创建新的。  

## 8.3. 那么如何控制呢？

对简单对象来说，声明 `bean` 标签时默认是单例模式，即只会创建一次对象。如果想创建多次，则让其中的 `scope` 属性等于 `prototype` 即可。<br />对复杂对象来说，如果实现了 `FactoryBean` 接口，在重写 `isSingleton` 方法时，如果返回 `true`，则只会创建一次对象，如果返回 `false`，则每次都会创建新的对象。如果没有实现 `FactoryBean` 接口，而是用的实例工厂和静态工厂方式来创建对象，则还是通过 `bean` 标签中的 `scope` 属性来控制。  

# 9. 对象的生命周期

## 9.1. 什么是对象的生命周期？

指的是一个对象从创建、初始化到销毁的一个完整过程。  

## 9.2. 生命周期的三个阶段

### 9.2.1. 创建阶段 (Spring 工厂何时创建对象)

结论：<br />当创建的是单例对象时，并且 `bean` 标签中的 `lazy-init` 属性为 false(默认为 false) 时，在 spring 工厂创建的时候就会创建出对象并给对象中的成员变量进行赋值。但如果 `bean` 标签中的 `lazy-init` 属性为 true，则会推迟到获取对象时才会去创建对象。<br />当创建的是原型 (prototype) 对象时，则在获取对象时每次都会去创建一个新的对象。  

#### 9.2.1.1. singleton && lazy-init=false

```java
@Test
public void test6() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120117298.png)  

#### 9.2.1.2. sinleton && lazy-init=true

如果还是上面的测试代码，获取工厂的时候并不会创建 Person 对象。<br />![image.png](https://cdn.nlark.com/yuque/0/2022/png/1554080/1647588703949-78900285-f65e-4eaf-abeb-7e5f88c96370.png#clientId=u4c720250-2228-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=390&id=uae4618fa&originHeight=390&originWidth=1457&originalType=binary&ratio=1&rotation=0&showTitle=false&size=250290&status=done&style=none&taskId=u2f6ae237-b8e4-4894-86d7-a6f9869b719&title=&width=1457)<br />============><br />在获取对象的时候才会去创建对象并且给对象中的成员变量进行赋值。

```java
@Test
public void test6() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = ctx.getBean("person", Person.class);
    System.out.println(person);
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120118931.png)  

#### 9.2.1.3. prototype

将 `bean` 标签中的 `scope` 属性设置成 `prototype`，测试代码和上面一样。

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person" scope="prototype">
    <constructor-arg name="name" value="小让"/>
    <constructor-arg name="age" value="10"/>
</bean> 
```

从下图可知，在获取对象的时候才去创建的对象。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120118707.png)  

### 9.2.2. 初始化阶段

#### 9.2.2.1. 定义

spring 工厂在创建完对象后，调用对象的初始化方法，完成对应的初始化操作 (资源的初始化, io,connection,网络)。其中的初始化方法根据项目需求由程序员提供，然后交给 spring 工厂进行调用。  

#### 9.2.2.2. 两种实现方式

1. 对象需要实现 `InitializingBean` 接口，然后重写 `afterPropertiesSet` 方法，这个方法就是完成对象初始化操作的地方；
1. 对象不实现 `InitializingBean` 接口，而是提供一个普通的初始化方法，放在 `bean` 标签中的 `init-method` 属性中。

两种实现方式放在一起测试演示：

```java
public class Person implements InitializingBean {
  private String name;
  private Integer age;

  private Person() {
    System.out.println("Person类私有构造方法");
  }

  public Person(String name, Integer age) {
    System.out.println("Person类全参构造方法");
    this.name = name;
    this.age = age;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    System.out.println("name=" + name);
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    System.out.println("age=" + age);
    this.age = age;
  }

  @Override
  public String toString() {
    return "Person{" + "name='" + name + '\'' + ", age=" + age + '}';
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    System.out.println("Person类的afterPropertiesSet初始化方法" );
  }
    
  public void myInit() {
    System.out.println("自定义的普通方法作为初始化方法" );
  }
}
```

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person" init-method="myInit">
    <property name="name" value="小让"/>
    <property name="age" value="10"/>
</bean>
```

```java
@Test
public void test6() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = ctx.getBean("person", Person.class);
    System.out.println(person);
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120118448.png)  

```ad-important
🎨<br />细节分析：从上面可以看出 spring 先通过反射调用 person 构造方法创建对象，然后使用 set 注入的方式给 person 对象中的成员变量 `name` 和 `age` 进行赋值，然后才执行 `initializingBean` 接口的 `afterPropertiesSet` 初始化方法，最后才执行自己定义的 `init-method` 初始化方法。  
```

### 9.2.3. 销毁阶段

#### 9.2.3.1. 定义

spring 销毁对象之前，会调用对象的销毁方法，完成销毁操作 (如资源释放，io,connection)。spring 会在关闭工厂的时候销毁掉创建出来的对象，其中的销毁操作需要程序员根据需求自定义，然后由 spring 工厂调用。  

#### 9.2.3.2. 两种实现方式

和上面的初始化方法一样，一种是实现 `DisposableBean` 接口，重写 `destroy` 方法；另一种是自定义销毁方法，然后在 `bean` 标签中的 `destroy-method` 属性中声明。<br />两种方式放在一起测试：

```java
public class Person implements InitializingBean, DisposableBean {
  private String name;
  private Integer age;

  private Person() {
    System.out.println("Person类私有构造方法");
  }

  public Person(String name, Integer age) {
    System.out.println("Person类全参构造方法");
    this.name = name;
    this.age = age;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    System.out.println("name=" + name);
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    System.out.println("age=" + age);
    this.age = age;
  }

  @Override
  public String toString() {
    return "Person{" + "name='" + name + '\'' + ", age=" + age + '}';
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    System.out.println("Person类的afterPropertiesSet初始化方法");
  }

  public void myInit() {
    System.out.println("自定义的普通方法作为初始化方法");
  }

  @Override
  public void destroy() throws Exception {
    System.out.println("Person类的destroy销毁方法");
  }

  public void myDestroy() {
    System.out.println("自定义的普通方法作为销毁方法");
  }
}
```

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person" init-method="myInit" destroy-method="myDestroy">
    <property name="name" value="小让"/>
    <property name="age" value="10"/>
</bean>
```

```java
@Test
public void test6() {
    ClassPathXmlApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = ctx.getBean("person", Person.class);
    System.out.println(person);
    ctx.close();
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120119574.png)<br />**再次完善 Bean 的生命周期流程**：  

```ad-important
🎨对象从创建 ->初始化 ->销毁的完整流程<br />细节分析：从上面可以看出 spring 先通过反射调用 person 构造方法创建对象，然后使用 set 注入的方式给 person 对象中的成员变量 `name` 和 `age` 进行赋值，然后才执行 `initializingBean` 接口的 `afterPropertiesSet` 初始化方法，最后才执行自己定义的 `init-method` 初始化方法。接下来在关闭工厂的时候，会先执行 `DisposableBean` 接口的 `destroy` 方法，然后才执行自定义的销毁方法。<br />💡注意<br />销毁方法只针对 `signleton` 对象。
```

# 10. 配置文件参数化

## 10.1. 什么叫配置文件参数化？

说白了就是把 spring 配置文件中需要经常修改的信息维护到另一个专门用于配置的小文件中。这样的话，在以后修改配置的过程中就不需要从 spring 配置文件中的几千行信息中去查找，而是直接在小配置文件中改动即可，这样也便于维护。  

## 10.2. 如何实现？

如前面的数据库连接配置就可以放到一个专门配置的文件中，这个文件就叫 `db.properties`。<br />值得注意的是加个前缀避免重名。

```properties
jdbc.driverClassName=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/atguigudb?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
jdbc.username=root
jdbc.password=
```

将 `db.properties` 文件整合到 `spring` 配置文件中。<br />💡**需要在配置文件的 `beans` 标签中添加 `xmlns:context` 的命名空间，然后还需要在 schemaLocation 中添加 context 的 xsd**。

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context-4.3.xsd">

<context:property-placeholder location="classpath:/db.properties"/>

<bean id="connection" class="top.xiaorang.spring.factorybean.ConnectionFactoryBean">
    <property name="driverClassName" value="${jdbc.driverClassName}"/>
    <property name="url" value="${jdbc.url}"/>
    <property name="username" value="${jdbc.username}"/>
    <property name="password" value="${jdbc.password}"/>
</bean>
```

```java
@Test
public void test5() {
    ApplicationContext ctx = new ClassPathXmlApplicationContext("/applicationContext.xml");
    Connection connection = ctx.getBean("connection", Connection.class);
    System.out.println(connection);
    Connection connection1 = ctx.getBean("connection", Connection.class);
    System.out.println(connection1);
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120119977.png)  

# 11. 自定义类型转换器

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120119019.png)<br />spring 提供了一堆默认的类型转换器，才能把 `value` 标签中的字符串赋值给对象中的成员变量。在上面给 JDK 内置类型的成员变量赋值时，提及到如果是 `Date` 类型，则需要自定义类型，因为 spring 默认提供的支持日期类型的转换器只支持 yyyy/MM/dd 的格式，如果想将 yyyy-MM-dd 格式的日期赋值给 `Date` 类型的成员变量，此时就得自定义类型转换器。  

## 11.1. 自定义类型转换器实现 Converter 接口

其中默认格式化为 "yyyy/MM/dd"，如果想格式化 "yyyy-MM-dd"，则在配置文件给成员变量赋值即可。

```java
public class MyDateConverter implements Converter<String, Date> {
  private String pattern = "yyyy/MM/dd";

  @Override
  public Date convert(String source) {
    try {
      SimpleDateFormat sdf = new SimpleDateFormat(pattern);
      return sdf.parse(source);
    } catch (ParseException e) {
      e.printStackTrace();
    }
    return null;
  }

  public String getPattern() {
    return pattern;
  }

  public void setPattern(String pattern) {
    this.pattern = pattern;
  }
}
```

## 11.2. 注册自定义 Converter

其中，值得注意的是 `ConversionServiceFactoryBean` 的标签 id 必须是 `conversionService`。

```xml
<bean id="myDateConverter" class="top.xiaorang.spring.converter.MyDateConverter">
    <property name="pattern" value="yyyy-MM-dd"/>
</bean>

<bean id="conversionService" class="org.springframework.context.support.ConversionServiceFactoryBean">
    <property name="converters">
        <set>
            <ref bean="myDateConverter"/>
        </set>
    </property>
</bean>
```

## 11.3. 在 Person 类中增加 Date 类型的成员变量

```java
public class Person implements InitializingBean, DisposableBean {
  private String name;
  private Integer age;
  private Date birthday;

  private Person() {
    System.out.println("Person类私有构造方法");
  }

  public Person(String name, Integer age) {
    System.out.println("Person类全参构造方法");
    this.name = name;
    this.age = age;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    System.out.println("name=" + name);
    this.name = name;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    System.out.println("age=" + age);
    this.age = age;
  }

  public Date getBirthday() {
    return birthday;
  }

  public void setBirthday(Date birthday) {
    this.birthday = birthday;
  }

  @Override
  public String toString() {
    return "Person{" + "name='" + name + '\'' + ", age=" + age + ", birthday=" + birthday + '}';
  }

  @Override
  public void afterPropertiesSet() throws Exception {
    System.out.println("Person类的afterPropertiesSet初始化方法");
  }

  public void myInit() {
    System.out.println("自定义的普通方法作为初始化方法");
  }

  @Override
  public void destroy() throws Exception {
    System.out.println("Person类的destroy销毁方法");
  }

  public void myDestroy() {
    System.out.println("自定义的普通方法作为销毁方法");
  }
}
```

## 11.4. 编写配置文件

```xml
<bean id="person" class="top.xiaorang.spring.basic.Person" init-method="myInit" destroy-method="myDestroy">
  <property name="name" value="小让"/>
  <property name="age" value="10"/>
  <property name="birthday" value="2022-03-18"/>
</bean>
```

## 11.5. 测试

```java
@Test
public void test1() {
    ApplicationContext applicationContext =
        new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = applicationContext.getBean("person", Person.class);
    System.out.println(person);
}
```

此时可以看到，日期类型就转换成功，并且赋值到 `birthday` 成员变量当中。

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120120692.png)  

# 12. BeanPostProcessor(后置处理 Bean)

## 12.1. BeanPostProcessor 接口干嘛用的？

对 Spring 工厂创建的对象进行再加工。  

## 12.2. BeanPostProcessor 接口的运行时机

**再次完善 Bean 的生命周期流程**：  

```ad-important
🎨对象从创建 ->初始化 ->销毁的完整流程<br />细节分析：从上面可以看出 spring 先通过反射调用 person 构造方法创建对象，然后使用 set 注入的方式给 person 对象中的成员变量 `name` 和 `age` 进行赋值，然后执行 `BeanPostProcessor#postProcessBeforeInitialization` 方法，然后才执行 `initializingBean` 接口的 `afterPropertiesSet` 初始化方法，最后才执行自己定义的 `init-method` 初始化方法和 `BeanPostProcessor#postProcessAfterInitialization` 方法。接下来在关闭工厂的时候，会先执行 `DisposableBean` 接口的 `destroy` 方法，然后才执行自定义的销毁方法。<br />💡注意<br />销毁方法只针对 `signleton` 对象。  
```

可以看到 BeanPostProcessor 接口定义了两个方法，一个 `postProcessBeforeInitialization`，运行在 `initializingBean` 接口的 `afterPropertiesSet` 初始化方法之前；另一个 `postProcessAfterInitialization` 方法则运行在自己定义的 `init-method` 初始化方法之后。<br />Spring 中的 AOP 底层实现就是在 `postProcessAfterInitialization` 方法中使用 jdk 的动态代理对 Bean 进行增强。  

## 12.3. 开发步骤

### 12.3.1. 实现 BeanPostProcessor 接口

```java
public class MyBeanPostProcessor implements BeanPostProcessor {
  @Override
  public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
    System.out.println("使用BeanPostProcessor接口中的after方法对 " + beanName + "进行增强");
    return bean;
  }
}
```

### 12.3.2. 编写配置文件

```xml
<bean class="top.xiaorang.spring.ioc.beanpostprocessor.MyBeanPostProcessor" />
```

### 12.3.3. 测试

```java
@Test
public void test1() {
    ApplicationContext applicationContext =
        new ClassPathXmlApplicationContext("/applicationContext.xml");
    Person person = applicationContext.getBean("person", Person.class);
    System.out.println(person);
}
```

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211120120835.png)

### 12.3.4. 代码分析

1. 从上图可以看出 `BeanPostProcessor#postProcessAfterInitialization` 方法运行在自定义的 `init-method` 方法之后。
2. `BeanPostProcessor` 会对 Spring 工厂中创建的所有 Bean 对象进行增强。
