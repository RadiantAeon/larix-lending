<template>

  <q-toolbar class="header gt-sm" >
<!--    电脑版-->
    <div class="tabsContainer " style="max-width: 1280px">
      <div style="display: flex;padding-left: 20px">
        <div style="display: flex;align-items: center">
          <img :src="logo" height="39" width="110"  alt="" style="margin-right: 83px;cursor: pointer" @click="setTab('About')" >
        </div>
        <div class="tabs">
          <div style="border-left: 2px solid #E6E6E6;padding: 0;margin: 0"></div>
          <div style="margin-left: 38px;" class="name" :class="$store.state.appTab==='Home'?'tabActive':''" @click="setTab('Home')">{{ t("headers.dashBoard") }}</div>
          <div  class="name" :class="$store.state.appTab==='Launchpad'?'tabActive':''" @click="setTab('Launchpad')">{{ t("headers.launchpad") }}</div>
          <div :class="$store.state.appTab==='Positions'?'tabActive':''" @click="setTab('Positions')">{{t('headers.Positions')}}</div>
          <div :class="$store.state.appTab==='Market'||$store.state.appTab==='MarketId'?'tabActive':''" @click="setTab('Market')">{{ t("headers.market") }}</div>
          <div :class="$store.state.appTab==='Liquidation'?'tabActive':''" @click="setTab('Liquidation')">{{ t("headers.liquidation") }}</div>
<!--          <div :class="$store.state.appTab==='About'?'tabActive':''" @click="setTab('About')">{{ t("headers.About") }}</div>-->
<!--          <div  @click="nftNoticeVisible = true">NFTs</div>-->

<!--          <div class="">{{ t("headers.stake") }}</div>-->
<!--          <div class="">{{ t("headers.dao") }}</div>-->
        </div>
      </div>
      <div class="btnStyle">
         <div class="rightBtn" v-if="!isLoadingInfo&&walletAddress!==''&&!isLoadingUserLarixStakeInfo">
           <div class="text" v-if="$store.state.market.userLarixReward.isGreaterThan(0)" @click="rewardDialogVisible = true">
             <span>{{$store.state.market.userLarixReward.toFixed(4)}}</span> <span>LARIX</span>
           </div>
           <div class="text" v-if="!$store.state.market.userLarixReward.isGreaterThan(0)" @click="rewardDialogVisible = true">
             0 LARIX
           </div>
           <q-btn class="btnConnect" @click="walletDialogVisible = true" no-caps>
             <span v-if="!walletAddress">{{ t('headers.connect') }}</span>
             <span v-else>
            {{ walletAddress.substr(0, 4) }}
            ...
            {{  walletAddress.substr( walletAddress.length - 2, 2) }}
            </span>
           </q-btn>
         </div>
        <q-btn class="btnConnect" @click="walletDialogVisible = true" v-else no-caps>
          <span v-if="!walletAddress">{{ t('headers.connect') }}</span>
          <span v-else>
            {{ walletAddress.substr(0, 4) }}
            ...
            {{  walletAddress.substr( walletAddress.length - 1, 4) }}
            </span>
        </q-btn>
        </div>
    </div>
  </q-toolbar>
<!--&lt;!&ndash;ipad版&ndash;&gt;-->
<!--  <q-toolbar class="ipadHeader gt-xs lt-md" >-->
<!--    <div class="tabsContainer" style="flex-basis: 100%">-->
<!--      <div style="display: flex">-->
<!--        <div>-->
<!--          <img :src="logo" height="32" width="102"  alt="" style="margin-right: 28px">-->
<!--        </div>-->
<!--&lt;!&ndash;        <div class="tabs">&ndash;&gt;-->
<!--&lt;!&ndash;          <div class="name" :class="$store.state.appTab==='Home'?'tabActive':''" @click="setTab('Home')">{{ t("headers.dashBoard") }}</div>&ndash;&gt;-->
<!--&lt;!&ndash;          <div :class="$store.state.appTab==='Market'||$store.state.appTab==='MarketId'?'tabActive':''" @click="setTab('Market')">{{ t("headers.market") }}</div>&ndash;&gt;-->
<!--&lt;!&ndash;          <div :class="$store.state.appTab==='Larix'?'tabActive':''" @click="setTab('Larix')">{{ t("headers.larix") }}</div>&ndash;&gt;-->
<!--&lt;!&ndash;          &lt;!&ndash;          <div class="">{{ t("headers.stake") }}</div>&ndash;&gt;&ndash;&gt;-->
<!--&lt;!&ndash;          &lt;!&ndash;          <div class="">{{ t("headers.dao") }}</div>&ndash;&gt;&ndash;&gt;-->
<!--&lt;!&ndash;        </div>&ndash;&gt;-->
<!--      </div>-->
<!--      <div class="btnStyle">-->
<!--        &lt;!&ndash;          <el-button class="btnReward" @click="rewardDialogVisible = true">&ndash;&gt;-->
<!--        &lt;!&ndash;            <span>{{ t('headers.reward') }}</span>&ndash;&gt;-->
<!--        &lt;!&ndash;          </el-button>&ndash;&gt;-->
<!--        <div class="rightBtn" v-if="!isLoadingInfo&&walletAddress!==''&&!isLoadingUserLarixStakeInfo">-->
<!--          <div class="text" v-if="$store.state.market.userLarixReward.isGreaterThan(0)" @click="rewardDialogVisible = true">-->
<!--            {{$store.state.market.userLarixReward.toFixed(4)}} LARIX-->
<!--          </div>-->
<!--          <div class="text" v-if="!$store.state.market.userLarixReward.isGreaterThan(0)" @click="rewardDialogVisible = true">-->
<!--            0 LARIX-->
<!--          </div>-->
<!--          <q-btn class="btnConnect" @click="walletDialogVisible = true" no-caps>-->
<!--            <span v-if="!walletAddress">{{ t('headers.connect') }}</span>-->
<!--            <span v-else>-->
<!--            {{ walletAddress.substr(0, 4) }}-->
<!--            ...-->
<!--            {{  walletAddress.substr( walletAddress.length - 1, 4) }}-->
<!--            </span>-->
<!--          </q-btn>-->
<!--        </div>-->
<!--        <q-btn class="btnConnect" @click="walletDialogVisible = true" v-else no-caps>-->
<!--          <span v-if="!walletAddress">{{ t('headers.connect') }}</span>-->
<!--          <span v-else>-->
<!--            {{ walletAddress.substr(0, 4) }}-->
<!--            ...-->
<!--            {{  walletAddress.substr( walletAddress.length - 1, 4) }}-->
<!--            </span>-->
<!--        </q-btn>-->
<!--      </div>-->
<!--    </div>-->
<!--  </q-toolbar>-->
  <!--    手机版-->
  <div class="appTabs lt-md">
    <div class="appTabsContent">
        <img :src="logo"  width="86" height="27.5"  alt="" @click="setTab('About')" style="cursor: pointer;">
      <div class="appBtnStyle">
        <div class="appRightBtn" v-if="!isLoadingInfo&&walletAddress!==''&&!isLoadingUserLarixStakeInfo">
          <div class="appText" v-if="$store.state.market.userLarixReward.isGreaterThan(0)" @click="rewardDialogVisible = true">
            {{$store.state.market.userLarixReward.toFixed(4)}} LARIX
          </div>
          <div class="appText" v-if="!$store.state.market.userLarixReward.isGreaterThan(0)" @click="rewardDialogVisible = true">
            0 LARIX
          </div>
          <q-btn class="appBtnConnect" @click="walletDialogVisible = true" no-caps>
            <span v-if="!walletAddress">{{ t('headers.connect') }}</span>
            <span v-else>
            {{ walletAddress.substr(0, 4) }}
            ...
            {{  walletAddress.substr( walletAddress.length - 1, 4) }}
            </span>
          </q-btn>
        </div>
        <q-btn class="appBtnConnect" @click="walletDialogVisible = true" v-else no-caps>
          <span v-if="!walletAddress">{{ t('headers.connect') }}</span>
          <span v-else>
            {{ walletAddress.substr(0, 4) }}
            ...
            {{  walletAddress.substr( walletAddress.length - 1, 4) }}
            </span>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script>

import {mapState} from "vuex";
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import {formatKmb} from "@/utils/helpers";
export default defineComponent({
  name: 'Header',
  data: () => ({
    formatKmb:formatKmb,
    logo: require('../assets/logo_larix@2x.png'),
    viewPort:0,
    currentTheme: 'light',
  }),
  created(){
    window.addEventListener('resize', this.ViewPortAndStyle)
    this.ViewPortAndStyle()
  },
  computed: {
    walletDialogVisible:{
      get() {
        return this.$store.state.wallet.walletDialogVisible
      },
      set(value) {
        this.$store.commit('updateWalletDialogVisible',value)
      }
    },
    nftNoticeVisible:{
      get() {
        return this.$store.state.dialog.nftNoticeVisible
      },
      set(value) {
        this.$store.commit('updateNFTNoticeVisible',value)
      }
    },
    rewardDialogVisible:{
      get() {
        return this.$store.state.reward.rewardDialogVisible
      },
      set(value) {
        this.$store.commit('updateRewardDialogVisible',value)
      }
    },
    ...mapState({
      walletAddress: (state) => state.wallet.walletAddress,
      isLoadingInfo:(state) =>state.market.isLoadingInfo,
      isLoadingUserLarixStakeInfo:(state) =>state.market.isLoadingUserLarixStakeInfo,
    })
  },
  setup(){
    const { t } = useI18n()
     return {
      t,
    }
  },
  methods: {
    ViewPortAndStyle(){
      this.viewPort = document.documentElement.clientWidth
    },
    setTab(value){
      this.$store.commit('updateAppTab',value)
    },
    changeTheme() {
      if (this.currentTheme !== 'light') {
        //todo 存vuex
        this.currentTheme = 'light'
        window.document.documentElement.setAttribute('data-theme','light')
        localStorage.setItem('currentTheme', 'light')
      } else {
        this.currentTheme = 'dark'
        window.document.documentElement.setAttribute('data-theme','dark')
        localStorage.setItem('currentTheme', 'dark')
      }
    },
  }
})
</script>

<style scoped lang="scss">
@import "../assets/theme/theme-mixin";
@import "../assets/theme/theme";
.header {
  @include setAttribute(border-bottom,$dark_color7,$dark_color7,1px solid);
  @include bg_color($light_color1,#1C2442);
  @include font_color($light_color4,$dark_color3);
  background: #1C2442;
  box-shadow: 0px 10px 64px 4px rgba(0, 0, 0, 0.1);
  position: fixed;
  top:0px;
  float:inherit;
  width: 100%;
  display: flex;
  align-content: center;
  height: 73px;

  z-index: 4;
  .tabsContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-basis: 100%;
    margin: 0 auto;
    .tabs {
      white-space: nowrap;
      display: flex;
      align-items: center;
      font-family: "Roboto, sans-serif";
      line-height: 15px;
      font-size: 20px;
      font-weight: 400;
      color: #FFFFFF;
      >div {
        text-align: center;
        line-height: 26px;
        height: 24px;
        cursor: pointer;
        width: fit-content;
        padding: 0 25px;
      }
      >div:hover{
        color: #2FCEFB;
      }
      .tabActive {
        color: #2FCEFB;
        font-weight: bold;
      }
    }
    .btnStyle{
      white-space: nowrap;
      margin-right: 10px;
      .btnReward{
        font-family: "Roboto, sans-serif";
        color: #FFFFFF;
        border: none;
        width: 108px;
        height: 32px;
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        border-radius: 20px;
      }
      .btnConnect {
        margin-left: 4px;
        font-family: "Roboto, sans-serif";
        color: #FFFFFF;
        border: none;
        width: 94px;
        height: 32px;
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        font-weight: 300;
        border-radius: 20px;
        >span {
          margin-left: 16px;

        }
      }
      .rightBtn{
        min-width: 200px;
        display: flex;
        justify-content: space-between;
        line-height: 34px;
        //@include bg_color($light_color1,#1C2442);
        border: 1px transparent solid;
        background-image: linear-gradient(#1A213D, #1A213D), linear-gradient(79deg, #1AE2FA, #B94AFF);
        background-origin: border-box;
        background-clip: padding-box, border-box;
        border-radius: 28px;
        padding: 2px;
        position: relative;
        .text{
          color: #32CCFB;
          font-size: 14px;
          margin: 0px 3px 0px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          >span:last-child{
            font-size: 12px;
            padding-left: 3px;
          }
        }
      }
      //.rightBtn:after{
      //  content: '';
      //  position: absolute;
      //  top: -3px;bottom: -3px;
      //  left: -3px;right: -3px;
      //  background: linear-gradient(-79deg, #B94AFF, #1AE2FA);
      //  border-radius: 30px;
      //  content: '';
      //  z-index: -1;
      //}
    }

  }
}
.ipadHeader{
  height: 60px;
  @include setAttribute(border-bottom,$dark_color7,$dark_color7,1px solid);
  background: #1C2442;
  //@include bg_color($light_color1,#1C2442);
  @include font_color($light_color4,$dark_color3);
  box-shadow: 0px 10px 64px 4px rgba(0, 0, 0, 0.1);
  top:0px;
  float:inherit;
  width: 100%;
  display: flex;
  align-content: center;
  z-index: 1;
  padding: 0 20px;
  .tabsContainer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 auto;
    .tabs {
      white-space: nowrap;
      display: flex;
      align-items: center;
      font-family: "Roboto, sans-serif";
      line-height: 18px;
      font-size: 18px;
      color: #FFFFFF;
      >div:first-child {
        border-left: 2px solid #E6E6E6;
        padding-left: 30px;
      }
      >div {
        text-align: center;
        height: 18px;
        cursor: pointer;
        width: fit-content;
        padding-left: 60px;
      }
      .tabActive {
        color: #2FCEFB;
        //font-weight: bold;
      }
    }
    .btnStyle{
      white-space: nowrap;
      //margin-right: 42px;
      .btnReward{
        font-family: "Roboto, sans-serif";
        color: #FFFFFF;
        border: none;
        height: 36px;
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        border-radius: 20px;
      }
      .btnConnect {
        padding-left: 17px;
        font-family: "Roboto, sans-serif";
        color: #FFFFFF;
        border: none;
        height: 36px;
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        border-radius: 20px;
        >span {
          padding-left: 16px;
        }
      }
      .rightBtn{
        display: flex;
        line-height: 38px;
        background: #1C2442;
        //@include bg_color($light_color1,#1C2442);
        border: 1px transparent solid;
        border-radius: 28px;
        //padding: 5px;
        padding: 1px;
        position: relative;
        .text{
          color: #32CCFB;
          font-size: 12px;
          margin: 0px 3px 0px 16px;
          cursor: pointer;
        }
      }
      .rightBtn:after{
        content: '';
        position: absolute;
        top: -3px;bottom: -3px;
        left: -3px;right: -3px;
        background: linear-gradient(-79deg, #B94AFF, #1AE2FA);
        border-radius: 30px;
        content: '';
        z-index: -1;
      }
    }

  }
}
.appTabs{
  //position: fixed;
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  color: #FFFFFF;
  background: #1C2442;
  height: 60px;
  z-index: 1;
  .appTabsContent{
    height: 27.5px;
    width: 92%;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .appLogo{
      height: 27.5px;
      width: 74px;
    }
  }
  .appBtnStyle{
    white-space: nowrap;
    .appBtnReward{
      font-family: "Roboto, sans-serif";
      color: #FFFFFF;
      border: none;
      width: 108px;
      height: 36px;
      background: linear-gradient(79deg, #1AE2FA, #B94AFF);
      border-radius: 20px;
    }
    .appBtnConnect {
      min-height: 0;
      line-height:  10px;
      margin-left: 8px;
      font-family: "Roboto, sans-serif";
      color: #FFFFFF;
      border: none;
      min-width: 59px;
      height: 28px;
      background: linear-gradient(79deg, #1AE2FA, #B94AFF);
      border-radius: 24px;
      font-size: 10px;
      >span {
        margin-left: 8px;
      }
    }
    .appRightBtn{
      display: flex;
      //@include bg_color($light_color1,#1C2442);
      background: #1C2442;
      border: 1px transparent solid;
      border-radius: 24px;
      padding: 1px;
      position: relative;
      .appText{
        color: #32CCFB;
        font-size: 10px;
        line-height: 28px;
        margin-left:8px;
        cursor: pointer;
      }
    }
    .appRightBtn:after{
      content: '';
      position: absolute;
      top: -2px;bottom: -2px;
      left: -2px;right: -2px;
      background: linear-gradient(-79deg, #B94AFF, #1AE2FA);
      border-radius: 27px;
      content: '';
      z-index: -1;
    }
  }
}
</style>
