import { isObject } from '@vue/shared'

// 判断普通对象有没有代理过，来决定是否用缓存
const reactiveMap = new WeakMap()

//判断有没有reactive过，来决定是否用缓存
const enum ReactiveFlag {
  IS_REACTIVE = '__v__isReactive'
}
export function reactive(target) {
  // 只能代理对象
  if (!isObject(target)) {
    return target
  }
  // 第一次进来是普通对象，不会走get，也没用有这个属性
  // 第二次进来 target[ReactiveFlag.IS_REACTIVE]这一步会去走get
  // get操作：第二次的时候，key就是这里的ReactiveFlag.IS_REACTIVE，
  // 肯定会等于外面定义的ReactiveFlag.IS_REACTIVE，所以为true，返回这个已经proxy的对象
  if (target[ReactiveFlag.IS_REACTIVE]) {
    //解决重复reactive对象，传入proxy的情况
    return target
  }
  //解决重复reactive对象，传入obj的情况
  const existing = reactiveMap.get(target)
  if (existing) {
    return existing
  }
  // proxy代理
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      if (key === ReactiveFlag.IS_REACTIVE) {
        return true
      }
      console.log('这里可以记录这个属性使用了哪个effect')
      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      console.log('这里可以通知effect重新执行')
      return Reflect.set(target, key, value, receiver)
    }
  })
  reactiveMap.set(target, proxy)
  return proxy
}
