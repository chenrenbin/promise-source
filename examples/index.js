// promise 三个状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

// 构造函数
function myPromise(excutor) {
  let that = this // 缓存当前Promise实例对象
  that.status = PENDING // 初始化状态
  that.value = undefined
  that.reason = undefined
  that.onFulfilledCallbacks = []
  that.onRejectedCallbacks = []
  
  function resolve (value) { // value成功时接收的终值
    if (value instanceof myPromise) { // 引起实例化后的后续
      return value.then(resolve, reject)
    }

    setTimeout(() => { // 避免重复或多次调用
      if (that.status === PENDING) {
        that.status = FULFILLED
        that.value = value
        that.onFulfilledCallbacks.forEach(cb => cd(that.value)) // 最终调用成功返回
      }
    })
  }

  function reject (reason) {
    setTimeout(() => {
      if (that.status === PENDING) {
        that.status = REJECTED
        that.reason = reason
        that.onRejectedCallbacks.forEach(cb => cb(that.reason)) // 最终调用拒绝返回
      }
    })
  }

  try {
    excutor(resolve, reject) // 首次执行自定义的callback---执行resolve或reject
  } catch (e) {
    reject(e)
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('循环引用'))
  }

  let called = false
  if (x instanceof myPromise) {
    if (x.status === PENDING) {
      x.then(y => {
        resolvePromise(promise2, y, resolve, reject)
      }, reason => {
        reject(reason)
      })
    } else {
      x.then(resolve, reject)
    }
  } else if (x != null && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {
      let then = x.then
      if (typeof then === 'function') {
        then.call(x, y => {
          if (called) return
          called = true
          resolvePromise(promise2, y, resolve, reject)
        }, reason => {
          if (called) return
          called = true
          reject(reason)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    resolve(x) // 循环then后的最终输出
  }
}

myPromise.prototype.then = function (onFulfilled, onRejected) {
  const that = this
  let newPromise
  onFulfilled =
    typeof onFulfilled === 'function' ? onFulfilled : value => value
  onRejected =
    typeof onRejected === 'function' ? onRejected : reason => throw reason

  if (that.status === FULFILLED) {
    return newPromise = new myPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          let x = onFulfilled(that.value)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  if (that.status === REJECTED) {
    return  newPromise = new myPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          let x = onRejected(that.reason)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  if (that.status === PENDING) {
    return newPromise = new myPromise((resolve, reject) => {
      that.onFulfilledCallbacks.push(value => {
        try {
          let x = onFulfilled(value)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
      that.onRejectedCallbacks.push(reason => {
        try {
          let x = onRejected(reason)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
  }
}

myPromise.all = function (promises) {
  return new myPromise((resolve, reject) => {
    let done = gen(promises.length, resolve)
    promises.forEach((promise, index) => {
      promise.then(value => {
        done(index, value)
      }, reject)
    })
  })
}

function gen (length, resolve) {
  let count = 0
  let values = []
  return function (i, value) {
    values[i] = value
    if (++count === length) {
      resolve(values)
    }
  }
}

myPromise.race = function (promises) {
  return new myPromise((resolve, reject) => {
    promises.forEach(promise => {
      promise.then(resolve, reject)
    })
  })
}

myPromise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

myPromise.resolve = function (value) {
  return new myPromise(resolve => {
    resolve(value)
  })
}

myPromise.reject = function (reason) {
  return new myPromise((resolve, reject) => {
    reject(reason)
  })
}

myPromise.deferred = function () {
  let defer = {}
  defer.promise = new myPromise((resolve, reject) => {
    defer.resolve = resolve
    defer.reject = reject
  })
  return defer
}

try {
  module.exports = myPromise
} catch (e) {}

