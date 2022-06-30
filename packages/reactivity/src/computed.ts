import { isFunction } from '@vue/shared'
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects
} from './effect'

export function computed(getterOrOptions) {
  let isGetter = isFunction(getterOrOptions)
  let getter
  let setter
  const fn = () => console.warn('computed只读的')
  if (isGetter) {
    getter = getterOrOptions
    setter = fn
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set || fn
  }
  return new ComputedRefImpl(getter, setter)
}
class ComputedRefImpl {
  private _value
  private _dirty = true //第一次要计算
  public effect
  public deps
  constructor(getter, public setter) {
    // 拿到effect实例让函数执行,第二个函数为scheduler,更新的时候执行,会先走
    //依赖收集能力,后续依赖的数据变化了,这个地方才会执行,可以更新页面,会自动执行
    this.effect = new ReactiveEffect(getter, () => {
      //这是里面依赖的,getter就是函数,后面的箭头函数,会在依赖更新时,触发
      console.log(this.deps)
      // 如果这个值变了
      if (!this._dirty) {
        //第一次的时候,变为了flase,所以!this._dirty要走
        this._dirty = true
        // 遍历执行effect,有scheduler走scheduler
        triggerEffects(this.deps) //触发的是fullname的
      }
    }) //拥有依赖收集的能力
  }
  //触发getter
  get value() {
    if (activeEffect) {
      // 让计算属性做依赖收集
      // 计算属性 -> effect set = [effect]
      // 收集effects,互相记住
      // 这是fullname计算属性收集的
      trackEffects(this.deps || (this.deps = new Set())) //传入这个this.deps,进去这个函数,会把this.deps添加依赖收集
    }
    // 第一次为true,计算, 后面:如果是dirty即为true,则通知重新计算
    if (this._dirty) {
      //脏的的时候执行
      this._dirty = false
      this._value = this.effect.run() //这里是不走scheduler的
    }
    // 否则使用缓存
    return this._value
  }
  //触发setter
  set value(newValues) {
    this.setter(newValues)
  }
}
