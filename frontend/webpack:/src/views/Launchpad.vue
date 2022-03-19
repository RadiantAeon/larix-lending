<template>
  <div class="launchpadContainer gt-sm">
    <div class="launchpadContainer-main">
      <div class="launchpadContainer-main-title">
        <p>{{t('launchpad.whatLaunchpad')}}</p>
      </div>
      <div class="launchpadContainer-main-info ">
        <div class="launchpadContainer-main-info-icon"></div>
        <div class="width">{{t('launchpad.details1')}}</div>
      </div>
      <div class="launchpadContainer-main-info ">
        <div class="launchpadContainer-main-info-icon"></div>
        <div class="width2">{{t('launchpad.details2')}}</div>

      </div>
      <div class="launchpadContainer-main-info " style="margin-bottom: 31px">
        <div class="launchpadContainer-main-info-icon"></div>
        <div class="width3">{{t('launchpad.details3')}}</div>
      </div>
      <div class="launchpadContainer-main-btn">
        <div class="operationButton">
          <a href="https://forms.gle/oT3ZtWd51eZhhR2Y9">{{t('launchpad.apply')}}</a>
        </div>
<!--        <div class="operationButton" style="background: #141B35;border: 1px solid #273564;margin-left: 12px;">-->
<!--          <a >More detail</a>-->
<!--        </div>-->
      </div>
      <div class="launchpadContainer-main-background"></div>
    </div>

  </div>
  <div class="launchpadContainerApp lt-md">
    <div class="launchpadContainerApp-main">
      <div class="launchpadContainerApp-main-title">
        <p>{{t('launchpad.whatLaunchpad')}}</p>
      </div>
      <div class="launchpadContainerApp-main-info ">
        <div class="launchpadContainerApp-main-info-icon"></div>
        <div class="width">{{t('launchpad.details1')}}</div>
      </div>
      <div class="launchpadContainerApp-main-info ">
        <div class="launchpadContainerApp-main-info-icon"></div>
        <div class="width">{{t('launchpad.details2')}}</div>

      </div>
      <div class="launchpadContainerApp-main-info " style="margin-bottom: 25px">
        <div class="launchpadContainerApp-main-info-icon"></div>
        <div class="width">{{t('launchpad.details3')}}</div>
      </div>
      <div class="launchpadContainerApp-main-btn">
        <div class="operationButton">
          <a href="https://forms.gle/oT3ZtWd51eZhhR2Y9">{{t('launchpad.apply')}}</a>
        </div>
<!--        <div class="operationButton" style="background: #141B35;border: 1px solid #273564;margin-left: 12px;">-->
<!--          <a href="https://forms.gle/oT3ZtWd51eZhhR2Y9">More detail</a>-->
<!--        </div>-->
      </div>
      <div class="launchpadContainerApp-main-background">
        <div class="background"></div>
      </div>
    </div>

  </div>
</template>

<script>
import {defineComponent} from "vue";
import {useI18n} from "vue-i18n";

export default defineComponent({
name: "Launchpad",
  setup(){
    const { t } = useI18n()
    return {
      t,
    }
  },
})
</script>

<style scoped lang="scss">
.launchpadContainer{
  background: #151727;
  max-width: 1280px;
  //height: 100vh;
  width: 100%;
  margin: 0 auto;
  &-main{
    color: white;
    background: #141B35;
    border: 1px solid #273564;
    border-radius: 18px;
    margin-top: 93px;
    padding: 0 70px 65px 70px;
    position: relative;
    &-background{
      position: absolute;
      top: 80px;
      right: 60px;
      z-index: 1;
      height: 389px;
      width: 465px;
      background-image: url("../assets/launchpad_background@2x.png");
      background-repeat: no-repeat;
      background-size: 100% 100%;
    }
    &-title{
      font-size: 36px;
      padding-top: 68px;
      > p{
        margin-bottom: 45px;
      }
    }
    &-info{
      font-size: 16px;
      color: #A1B7EE;
      position: relative;
      z-index: 2;
      padding:0 0 16px 15px;
      display: flex;
      &-icon{
        background: #A1B7EE;
        height: 6px;
        border-radius: 50%;
        width: 6px;
        margin:8px 16px 0 0;
      }
    }
    .width{
      width: 510px;
    }
    .width2{
      width: 467px;
    }
    .width3{
      width: 455px;
    }
    &-btn{
      width: 289px;
      padding-left: 10px;
      display: flex;
      .operationButton{
        position: relative;
        overflow: hidden;
        display: flex;
        padding: 0 8px;
        min-width: 138px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        height: 42px;
        line-height: 37px;
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        border-radius: 31px;

        >a{
          color: #FFFFFF;
          font-size: 16px;
          text-decoration:none;
        }

        > span {
          white-space: nowrap;
        }
      }
      .operationButton::before{
        position: absolute;
        content: "";
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
                120deg,
                transparent,
                hsla(290,60%,90%,0.3),
                transparent
        );
        transform: translateX(-100%);
        transition: 0.6s;
      }
      .operationButton:hover{
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        //box-shadow: 0 0 20px 10px hsla(var(--189), 100%, 41%, 0.5);
      }
      .operationButton:hover::before{
        transform: translateX(100%);
      }
    }
  }
}
.launchpadContainerApp{
  background: #151727;
  width: 100%;
  margin: 0 auto;
  &-main{
    margin: 10px 15px 100px;
    background: #141B35;
    border: 1px solid #273564;
    border-radius: 18px;
    color: white;
    padding-left: 25px;
    position: relative;

    &-background{
      height: 223px;
      width: 100%;
      position: relative;
      .background{
        position: absolute;
        right: 0;
        height: 223px;
        width: 266.5px;
        background-image: url("../assets/launchpad_background@2x.png");
        background-repeat: no-repeat;
        background-size: 100% 100%;
      }
    }
    &-title{
      font-size: 18px;
      padding-top: 32px;
      > p{
        margin-bottom: 21px;
      }
    }
    &-info{
      font-size: 12px;
      color: #A1B7EE;
      display: flex;
      margin-bottom: 12px;
      &-icon{
        width: 3px;
        height: 3px;
        margin-top: 8px;
        border-radius: 4px;
        background:  #A1B7EE;
        margin-right: 8px;
      }
    }
    .width{
      width: 234px;
    }
    &-btn{
      width: 289px;
      display: flex;
      padding-bottom: 20px;
      .operationButton{
        position: relative;
        overflow: hidden;
        display: flex;
        padding: 0 8px;
        min-width: 104px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        height: 34px;
        line-height: 37px;
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        border-radius: 31px;

        >a{
          color: #FFFFFF;
          font-size: 14px;
          text-decoration:none;
        }

        > span {
          white-space: nowrap;
        }
      }
      .operationButton::before{
        position: absolute;
        content: "";
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
                120deg,
                transparent,
                hsla(290,60%,90%,0.3),
                transparent
        );
        transform: translateX(-100%);
        transition: 0.6s;
      }
      .operationButton:hover{
        background: linear-gradient(79deg, #1AE2FA, #B94AFF);
        //box-shadow: 0 0 20px 10px hsla(var(--189), 100%, 41%, 0.5);
      }
      .operationButton:hover::before{
        transform: translateX(100%);
      }
    }
  }
}
</style>