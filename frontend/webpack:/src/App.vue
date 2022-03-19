<template>
  <meta name="viewport" :content="viewportContent">
<!--  <div class="flexHeight" v-if="isShow===1">-->
<!--    <div class="main gt-xs" style="display: flex;align-items: center;justify-content: center">-->
<!--      <div style="display: flex;align-items: center;justify-content: center" class="timeDownBackground">-->
<!--        <div >-->
<!--          <p class="timeDownTitle" >The website is being</p>-->
<!--          <p class="timeDownTitle" >-->
<!--            updated Stay tuned!-->
<!--           </p>-->
<!--          <div style="display: flex;justify-content: center">-->
<!--            <time-down style="margin-top: 20px" :start-time="startTime" end-time="" type="PC"></time-down>-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="timeDownLogo">-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
<!--    <div class="main lt-sm" style="display: flex;align-items: center;justify-content: center">-->
<!--      <div class="timeDownBackground">-->
<!--        <p style=" font-size: 24px;font-weight: bold;color: #FFFFFF" class="timeDownTitle"> The website is being</p>-->
<!--        <p style=" font-size: 24px;font-weight: bold;color: #FFFFFF" class="timeDownTitle">  updated Stay tuned!</p>-->
<!--        <div style="display: flex;justify-content: center">-->
<!--          <time-down style="margin-top: 20px" :start-time="startTime" end-time="" type="APP"></time-down>-->
<!--        </div>-->
<!--        <div class="timeDownLogoAPP"> </div>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->
  <div class="flexHeight" >
    <Header/>
    <div class="main">
      <Home v-if="$store.state.appTab==='Home'"/>
      <Launchpad v-if="$store.state.appTab==='Launchpad'"/>
      <Positions v-if="$store.state.appTab==='Positions'"/>
      <Market v-if="$store.state.appTab==='Market'"/>
      <MarketId v-if="$store.state.appTab==='MarketId'"/>
      <Liquidation v-if="$store.state.appTab==='Liquidation'"/>
      <About v-if="$store.state.appTab==='About'"/>
    </div>
    <wallet></wallet>
    <Reward></Reward>
    <LarixStakingDialog></LarixStakingDialog>
    <NoticeDialog></NoticeDialog>
    <HandleLpDialog></HandleLpDialog>
    <BorrowFeeTipDialog></BorrowFeeTipDialog>
    <NFTNotice></NFTNotice>
    <q-dialog v-model="$store.state.txDialog.confirmDialog">
      <TransactionDialog v-if="$store.state.txDialog.confirmDialog"/>
    </q-dialog>
    <Footer/>
  </div>
</template>

<script >
import Positions from "@/views/Positions";
import Header from './components/Header.vue'
import Footer from "@/components/Footer";
import Home from "@/views/Home";
import Wallet from "@/components/Wallet";
import MarketId from "@/views/MarketId";
import Market from "@/views/Market";
import Reward from "@/components/Reward";
import Liquidation from "@/views/Liquidation";
import {connect} from "@/api/context/wallet";
import {mapState} from "vuex";
import About from "@/views/About";
import NoticeDialog from "@/components/NoticeDialog";
//@ts-ignore
import TransactionDialog from "@/components/TransactionDialog";
import BorrowFeeTipDialog from "@/components/BorrowFeeTipDialog";
import Launchpad from "@/views/Launchpad";

import HandleLpDialog from "@/components/HandleLpDialog";
import NFTNotice from "@/components/NFTNotice";
import LarixStakingDialog from "@/components/LarixStakingDialog";
// import TimeDown from "@/components/TimeDown";
// import {leftTime} from "@/utils/helpers";
let interval
export default {
  name: 'App',
  components: {
    LarixStakingDialog,
    NoticeDialog,
    TransactionDialog,
    BorrowFeeTipDialog,
    HandleLpDialog,
    NFTNotice,
    Liquidation,
    Wallet,
    Header,
    Home,
    Positions,
    Footer,
    MarketId,
    Market,
    About,
    Reward,
    Launchpad
  },
  methods: {
    setTheme(theme) {
      window.document.documentElement.setAttribute('data-theme',theme)
    },
  },

  data: () => ({
    //
    test:true,
    // startTime:  1640779200000,
    //          1640769450000
    // isShow:0,
    //12 29  :1640779200000

    //            1631104075000
  }),
  created() {
    // let now
    // interval = setInterval(() => {
    //   now = new Date().getTime()
    //   if (this.startTime-now>0)
    //   {
    //     this.isShow = 1
    //     this.leftTime = leftTime(this.startTime-now)
    //   }else {
    //     this.isShow =1
    //   }
    // }, 1000)
  },
  computed:{
    viewportContent: function () {
      const phoneWidth = parseInt(window.screen.width);
      // const phoneHeight = parseInt(window.screen.height);
      let phoneScale = phoneWidth/420;//除以的值按手机的物理分辨率
      phoneScale = Math.min(phoneScale,1)
      // return "width=device-width, initial-scale="+this.phoneScale+',minimum-scale='+this.phoneScale+',maximum-scale ='+this.phoneScale +',user-scalable=no,"'
      return "width=device-width, initial-scale="+phoneScale+',minimum-scale='+phoneScale+',maximum-scale ='+phoneScale +',user-scalable=no,viewport-fit=cover'
    },
    ...mapState({
      isLoadingInfo:(state) =>state.market.isLoadingInfo,
    })
  },
  mounted() {
    setTimeout(()=>{
      if (new Date().getTime() < 1631858400000) {
        this.$store.commit('updateNoticeDialogVisible', true)
      }
    },1000)
    // let now = new Date().getTime()
    // if (this.startTime-now>0)
    // {
    //   this.isShow = 1
    // }else {
    //   this.isShow = 1
    // }
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    this.setTheme('dark')
    const isFirstVisit = localStorage.getItem('isFirstVisit')
    if (isFirstVisit){
      const walletName = localStorage.getItem('walletName')
      if (walletName) {
        // TODO: 延迟100ms等待钱包对象注入
        setTimeout(()=>{
          connect(walletName).then(()=>{

          })
        },500)
      }
    }else {
      setTimeout(()=>{
        this.$store.commit('updateBorrowFeeTipDialogVisible', true)
      },500)
      localStorage.setItem('isFirstVisit','false')
    }
    let lang = localStorage.getItem('lang')
    if(!lang){
      switch (window.navigator.language) {
        case 'en':
          lang = 'en'
          localStorage.setItem('lang',lang)
          break
        case 'zh':
        case 'zh-CN':
        case 'zh-HK':
          lang = 'zh-cn'
          localStorage.setItem('lang',lang)
          break
        case 'id':
          lang = 'in'
          localStorage.setItem('lang',lang)
          break
        case 'ru':
          lang = 'ru'
          localStorage.setItem('lang',lang)
          break
        case 'vi':
          lang = 'vn'
          localStorage.setItem('lang',lang)
          break
        case 'ko':
          lang = 'kn'
          localStorage.setItem('lang',lang)
          break
        case 'tr':
          lang = 'tr'
          localStorage.setItem('lang',lang)
          break
        default:
          lang = 'en'
          localStorage.setItem('lang',lang)
      }
    }
    this.$i18n.locale = lang
  },
  beforeUnmount() {
    clearInterval(interval)
  }
}
</script>
<style lang="scss">
@import "./assets/theme/theme-mixin";
@import "./assets/theme/theme";
* {
  margin: 0;
  padding: 0;
}
html,body {
  height: 100%;
  @include bg_color($light_color2,$dark_color1);
}
.flexHeight{
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}
.main {
  background: #151726;
  flex: 1 0 auto;
  width: 100%;
  //.timeDownTitle{
  //  margin-bottom: 0;
  //  background-image: linear-gradient(
  //          -90deg, #00FFD2 78%, #2FDAFF 54.726563%, #F727FF 98.115234%, #D800FF 47.047852%);
  //  //background-image: linear-gradient(90deg,#D800FF,#F727FF);
  //  -webkit-text-fill-color: transparent;
  //  -webkit-background-clip:text;
  //  font-size: 48px;font-weight: bold;color: #FFFFFF
  //}
  //.timeDownBackground{
  //  background-image: url("./assets/timeDownBackgroud.png");
  //  background-size: 100% 100%;
  //
  //}
  //.timeDownLogo{
  //  height: 300px;
  //  width: 300px;
  //  background-image: url("./assets/timeDownLogo.png");
  //  background-size: 100% 100%;
  //}
  //.timeDownLogoAPP{
  //  margin: 0 auto;
  //  height: 120px;
  //  width: 120px;
  //  background-image: url("./assets/timeDownLogo.png");
  //  background-size: 100% 100%;
  //}
}
</style>
