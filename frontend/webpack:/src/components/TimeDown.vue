<template>
<!--  <div v-if="isShow">-->
    <div  class="gt-sm">
      <div class="timeDownPCBody">
        <div class="item">
          {{leftTime.day}}
        </div>
        <div class="padding">:</div>
        <div class="item">
          {{leftTime.hour}}
        </div>
        <div class="padding">:</div>
        <div class="item">
          {{leftTime.minutes}}
        </div>
        <div class="padding">:</div>
        <div class="item">
          {{leftTime.seconds}}
        </div>
      </div>
    </div>
    <div class="lt-md">
      <div class="timeDownAPPBody">
        <div class="appItem">
          {{leftTime.day}}
        </div>
        <div class="appPadding">:</div>
        <div class="appItem">
          {{leftTime.hour}}
        </div>
        <div class="appPadding">:</div>
        <div class="appItem">
          {{leftTime.minutes}}
        </div>
        <div class="appPadding">:</div>
        <div class="appItem">
          {{leftTime.seconds}}
        </div>
      </div>
    </div>
<!--  </div>-->


</template>

<script>
import {leftTime} from '@/utils/helpers';
let interval
export default {
  name: "TimeDown",
  props:['startTime','endTime'],

    watch: {
      // 'stake.status'(e) {
      //
      // }
    },
    mounted() {
      let now
      interval = setInterval(() => {
        now = new Date().getTime()
        if (this.startTime-now>0)
        {
          this.isShow = true
          this.leftTime = leftTime(this.startTime-now)
        }else {
          this.isShow =false
          clearInterval(interval)
        }

      }, 1000)
    },
    beforeUnmount() {
      clearInterval(interval)
    },
    data() {
      return {
        leftTime: '',
        isShow:false
      }
    },
    methods: {}
}

</script>

<style lang="scss" scoped>
.timeDownPCBody{
  display: flex;
  justify-content: center;
  .item{
    color: #FFFFFF;
    display: flex;
    height: 60px;
    width: 60px;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    border-radius: 4px;
    //border: 1px solid #B94AFF;
  }
  .padding{
    height: 48px;
    font-size: 48px;
    color: #FFFFFF;
    padding: 0px 8px;
    display: flex;
    align-items: center;
  }
}
.timeDownAPPBody{
  display: flex;
  justify-content: center;
  .appItem{
    font-size: 25px;
    color: #FFFFFF;
    height: 44.5px;
    width: 44.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    //border: 1px solid #B94AFF;
  }
  .appPadding{
    color: #FFFFFF;
    font-size: 25px;
     padding: 0px 8px;
     display: flex;
     align-items: center;
   }
}
</style>