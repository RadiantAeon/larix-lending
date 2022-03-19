<template>
  <div class="aboutPC gt-sm">
    <div class="aboutTopPC">
      <div class="aboutTopPCBody" :aspect-ratio="2.158">
        <div class="left">
          <div class="leftContent">
            <p class="leftTitle"> {{t('About.aboutLarix')}}</p>
            <p class="leftBody">{{t('About.aboutLarixContext')}}</p>
            <q-btn class="leftButton" no-caps @click="openAuditReport()">{{t('About.auditReport')}}</q-btn>
          </div>

        </div>
        <div  class="backgroundImageFloor">
          <div class="right" ></div>
        </div>
      </div>
    </div>
    <div class="aboutBottomPC">
      <div class="firstFloor">
        <p class="title">{{ t('About.whyLarix') }}</p>
        <div class="content">
          <div class="firstContent">
            <img :src="whyLarixImage[0].src" style="height: 96px;width: 96px">
            <div class="text">
              {{t('About.reason1')}}
            </div>
          </div>
          <div class="secondContent">
            <img :src="whyLarixImage[1].src" style="height: 96px;width: 96px">
            <div class="text">
              {{t('About.reason2')}}
            </div>
          </div>
          <div class="thirdContent">
            <img :src="whyLarixImage[2].src" style="height: 96px;width: 96px">
            <div class="text">
              {{t('About.reason3')}}
            </div>
          </div>
        </div>
      </div>
      <div class="secondFloor">
        <p class="title"> {{t('About.roadmap')}}</p>
        <div class="content" style="height: 207px">
          <div content="first">
            <img :src="numberImage[0].src" style="height: 214px;width: 91px">
          </div>
          <div class="body" >
            <div style="display: flex" class="roadmap1Title">
              <p style="padding-right: 28px">>></p> <p >{{t('About.roadmapStep1')}}</p>
            </div>
            <div class="roadmap1Body">{{t('About.roadmapStep1Context')}}</div>
            <div style="height: 26px;margin-right: 246px;border-radius: 0 0 0 20px;border-left: 1px solid #30DAFF;border-bottom: 1px solid #30DAFF"></div>
          </div>
        </div>
        <div class="content" style="height: 216.6px">
          <div class="second">
            <div class="body">
              <div style="width: 100%;height: 60px;display: flex;" >
                <div style="width: 100%;height: 100%;position: relative">
                  <div style="height: 60px;width: 77px;border-radius: 0 20px 0 0;border-top: 1px dashed #30DAFF;border-right: 1px dashed #30DAFF;float: right"></div>
                </div>
              </div>
              <p class="roadmap2Title">
                {{t('About.roadmapStep2')}}
              </p>
              <p class="roadmap2Body">{{t('About.roadmapStep2Context')}}</p>
              <div style="width: 100%;height: 40.6px;display: flex;" >
                <div style="width:100%;height: 100%;position: relative">
                  <div class="calcWidth" style="height: 100%;border-right:1px solid #30DAFF;border-bottom: 1px solid #30DAFF ;border-radius: 0 0 20px 0 ;float: right">
                  </div>
                </div>
              </div>
            </div>
            <img :src="numberImage[1].src" style="height: 217px;width: 152px;margin-left: 17px">
          </div>
        </div>
        <div class="content" style="padding-bottom: 64px">
          <img :src="numberImage[2].src" style="height: 223px;width: 151px;margin-right: 17px">
          <div class="third" >
            <div style="height: 45px;width: 84px;border-top: 1px dashed #30DAFF;border-left: 1px dashed #30DAFF;border-radius: 20px 0 0 0"></div>
            <div style="display: flex" class="roadmap3Title">
              <p >{{t('About.roadmapStep3')}}</p>
            </div>
            <div class="roadmap3Body">{{t('About.roadmapStep3Context')}}</div>
            <div style="padding-right: 211px;width: 100%;display: flex">
              <div style="height: 44px;width: 80%;border-left: 1px solid #30DAFF;border-bottom: 1px solid #30DAFF;border-radius: 0 0 0 20px">
              </div>
              <div style="height: 44px;border-bottom: 1px dashed #30DAFF;width: 20%">
                  <p style="position: relative;font-size: 23px;color: #FFFFFF;top: 27px;left: 100%">>></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="thirdFloor">
        <p class="thirdFloorTitle">{{t('About.seedRoundInvestor')}}</p>
        <div class="thirdFloorBody">
          <div class="thirdFloorItem" v-for="(item) in seedRoundInvestor" :key="item.id">
            <img :src="item.src" width="268" height="68" style="background-size: 70% 70%">
          </div>
        </div>
      </div>
      <div class="fourFloor">
        <p class="fourFloorTitle">{{t('About.partnership')}}</p>
        <div class="fourFloorBody">
          <div class="fourFloorItem" v-for="(item) in partnership" :key="item.id">
            <img :src="item.src" width="268" height="68" >
          </div>
        </div>
      </div>
      <div class="fifthFloor">
        <p class="fifthFloorTitle">{{t('About.audit')}}</p>
        <div class="fifthFloorBody">
          <div class="fifthFloorItem" >
            <img :src="$i18n.locale==='zh-cn'?audit.cn.src:audit.en.src" :style="$i18n.locale==='zh-cn'?'width:195px;height:64px':'width:305px;height:58px'" >
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="aboutAPP lt-md">
    <div class="aboutTopAPP">
      <div style="width: 83.7%;max-width: 314px;padding-top: 55px;z-index: 2" >
        <div class="aboutContextAPP">
          {{t('About.aboutLarixContext')}}
        </div>
        <div style="display: flex;align-items: center;justify-content: center">
          <q-btn class="topButton" no-caps @click="openAuditReport()">{{t('About.auditReport')}}</q-btn>
        </div>
      </div>
      <div class="topBackgroundAPP">
        <div class="backgroundImageAPP"></div>
      </div>
    </div>
    <div class="aboutBottomAPP">
      <div class="firstFloorAPP">
        <p class="firstFloorTitle"> {{t('About.whyLarix')}}</p>
        <div class="firstFloorBody" style="margin-top: 12px">
          <img :src="whyLarixImage[0].src" width="48" height="48" style="margin: 13px 18px 14px 17px">
          <span class="content">{{t('About.reason1')}}</span>
        </div>
        <div class="firstFloorBody" style="margin-top: 5px">
          <img :src="whyLarixImage[1].src" width="48" height="48" style="margin: 13px 18px 14px 17px">
          <span class="content">{{t('About.reason2')}}</span>
        </div>
        <div class="firstFloorBody" style="margin-top: 5px">
          <img :src="whyLarixImage[2].src" width="48" height="48" style="margin: 13px 18px 14px 17px">
          <span class="content">{{t('About.reason3')}}</span>
        </div>
      </div>
      <div class="secondFloorAPP">
        <p class="secondFloorTitle">
          {{t('About.roadmap')}}
        </p>
        <div class="secondFloorBody">
          <div class="roadmapStep1">
            <img :src="numberImage[0].src" width="45" height="107">
            <div class="step1">
              <p class="roadmapStep1Title">{{t('About.roadmapStep1')}}</p>
              <p class="roadmapStep1Content">{{t('About.roadmapStep1Context')}}</p>
            </div>
          </div>
          <div class="roadmapStep2">
            <div class="step2" >
              <p class="roadmapStep2Title">{{t('About.roadmapStep2')}}</p>
              <p class="roadmapStep2Content">{{t('About.roadmapStep2Context')}}</p>
            </div>
            <img :src="numberImage[1].src" width="76" height="108" style="margin-left: 8px">
          </div>
          <div class="roadmapStep3">
            <img :src="numberImage[2].src" width="75" height="111">
            <div class="step3">
              <p class="roadmapStep3Title">{{t('About.roadmapStep3')}}</p>
              <p class="roadmapStep3Content">{{t('About.roadmapStep3Context')}}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="thirdFloorAPP">
        <p class="thirdFloorTitle">
          {{t('About.seedRoundInvestor')}}
        </p>
        <div class="thirdFloorBody">
          <div class="thirdFloorBodyItem" v-for="item in seedRoundInvestor" :key="item.id">
            <img :src="item.src" width="134" height="29" style="background-size: 100% 100%" >
          </div>
        </div>
      </div>
      <div class="fourFloorAPP">
        <p class="fourFloorTitle">
          {{t('About.partnership')}}
        </p>
        <div class="fourFloorBody">
          <div class="fourFloorBodyItem" v-for="item in partnership" :key="item.id">
            <img :src="item.src" width="134" height="29" >
          </div>
        </div>
      </div>
      <div class="fifthFloorAPP">
        <p class="fifthFloorTitle">
          {{t('About.audit')}}
        </p>
        <div class="fifthFloorBody">
          <img :src="$i18n.locale==='zh-cn'?audit.cn.src:audit.en.src" :style="$i18n.locale==='zh-cn'?'width:98px;height:32px':'width:166px;height:33px'" >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import {useI18n} from "vue-i18n";


export default defineComponent ({
  name: "About",
  components:{

  },
  data(){
    return{
      topImageAPP:{
        src:require('../assets/APP_about_banner@3x.png')
      },
      whyLarixImage:[
        { src:require('../assets/about_icon_mining@2x.png')},
        { src: require('../assets/about_icon_nfts@2x.png')},
        { src: require('../assets/about_icon_open@2x.png')}
      ],
      numberImage:[
        { src:require('../assets/roadmap_icon_01@2x.png')},
        { src:require('../assets/roadmap_icon_02@2x.png')},
        { src:require('../assets/roadmap_icon_03@2x.png')},
      ],

      seedRoundInvestor:[
        { src:require('../assets/investor_solana@2x.png')},
        { src:require('../assets/investor_Solar@2x.png')},
        { src:require('../assets/investor_epsilon@2x.png')},
        { src:require('../assets/investor_huobi@2x.png')},
        { src:require('../assets/investor_gate@2x.png')},
        { src:require('../assets/investor_mexc@2x.png')},
        { src:require('../assets/investor_bitmart@2x.png')},
        { src:require('../assets/investor_fenbushi@2x.png')},
        { src:require('../assets/investor_polygon@2x.png')},
        { src:require('../assets/investor_FBG@2x.png')},
        { src:require('../assets/investor_3Commas@2x.png')},
        { src:require('../assets/investor_LDCapital@2x.png')},
        { src:require('../assets/investor_LancerCapital@2x.png')},
        { src:require('../assets/investor_zonff@2x.png')},
        { src:require('../assets/investor_factblock@2x.png')},
        { src:require('../assets/investor_LibraCapital@2x.png')},
        { src:require('../assets/investor_IconPlusCapital@2x.png')},
        { src:require('../assets/investor_OIGCapital@2x.png')},
      ],
      partnership:[
        { src:require('../assets/partner_Plutos@2x.png')},
        { src:require('../assets/partner_Pyth @2x.png')},
      ],
      audit:{
        en:{
          src:require('../assets/audit_slowmist@2x.png')
        },
        cn:{
          src:require('../assets/audit_slowmist_cn.png')
        }
      },
    }
  },
  setup(){
    const { t } = useI18n()
    return {
      t
    }
  },
  methods:{
    openAuditReport(){
      window.open('https://www.slowmist.com/en/security-audit-certificate.html?id=4d955aa4e09d6cd1c604f59222981d99700bd5e1b400f7d18d20b07289dd28cc')
    }
  }
})
</script>

<style scoped lang="scss">
.aboutPC{
  background: #151726;
  flex: 1 1 auto;
  margin-top: 73px;
  .aboutTopPC{
    background: #000214;
    flex-basis: 100%;

    background-size: 100%;
    .aboutTopPCBody{
      display: flex;
      flex-basis: 100%;
      max-width: 1280px;
      margin: 0 auto;
      .left{
        z-index: 2;
        height: 500px;
        flex-basis: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 47px;
        .leftContent{
          .leftTitle{
            font-weight: bold;
            background-image: linear-gradient(
                    -90deg, #00FFD2 78%, #2FDAFF 54.726563%, #F727FF 98.115234%, #D800FF 47.047852%);
            //background-image: linear-gradient(90deg,#D800FF,#F727FF);
            -webkit-text-fill-color: transparent;
            -webkit-background-clip:text;
            //color: transparent;
            line-height: 48px;
            font-size: 42px;
            margin-bottom: 45px;
            //color: #FFFFFF;
          }
          .leftBody{
            color: #FFFFFF;
            line-height: 26px;
            font-size: 16px;
            margin-bottom: 42px;
            text-align: justify;
          }
          .leftButton{
            color: #FFFFFF;
            font-size: 18px;
            border: 1px solid #17DCFF;
            border-radius: 21px;
          }
        }

      }
      .right{
        background-image: url("../assets/about_banner.png");
        background-size: 100% 100%;
        background-repeat: no-repeat;
        position: relative;
        float: right;
        width: 900px;
        height: 500px;
      }
      .backgroundImageFloor{
        width: 100%;
        max-width:1280px;
        height: 50vw;
        max-height: 500px;
        position: absolute;
        background-image: url("../assets/about_light.png");
      }
    }
  }
  .aboutBottomPC{

    flex-basis: 100%;
    max-width: 1280px;
    margin: 0 auto;


    //background: #191B2D;
    .firstFloor{
      margin-top: 18px;
      flex-basis: 100%;
      background: #151C33;
      border: 1px solid #2A3661;
      border-radius: 12px;
      //max-width: 1280px;
      .title{
        color: #FFFFFF;
        font-size: 23px;
        line-height: 23px;
        padding: 41px 0px 24px 47px;
        margin-bottom: 0;
      }
      .content{
        padding: 0 50px 44px 50px;
        display: flex;
        .firstContent{
          padding: 23px 0 30px 0px;
          border: 1px solid #273053;
          border-radius: 10px;
          text-align: center;
          flex-basis: 32%;
          .text{
            color: #FFFFFF;
            font-size: 16px;
            padding: 0 63px;
          }
        }
        .secondContent{
          padding: 23px 0 30px 0px;
          border: 1px solid #273053;
          border-radius: 10px;
          text-align: center;
          flex-basis: 32%;
          margin-left: 4%;
          .text{
            color: #FFFFFF;
            font-size: 16px;
            padding: 0 48px;
          }
        }
        .thirdContent{
          padding: 23px 0 30px 0px;
          border: 1px solid #273053;
          border-radius: 10px;
          text-align: center;
          flex-basis: 32%;
          margin-left: 4%;
          .text{
            color: #FFFFFF;
            font-size: 16px;
            padding: 0 61px;
          }
        }
      }
    }
    .secondFloor{
      margin: 18px 0;
      flex-basis: 100%;
      background: #151C33;
      border: 1px solid #2A3661;
      border-radius: 12px;
      //max-width: 1280px;
      .title{
        color: #FFFFFF;
        font-size: 23px;
        line-height: 23px;
        padding: 43px 0px 75px 48px;
        margin-bottom: 0;
      }
      .content{
        padding: 0 24px 0 29px;
        display: flex;
        .first{
        }
        .body{
          padding-left: 79px;
          .roadmap1Title{
            padding-top: 19px;
            >p{
              color: #FFFFFF;
              font-size: 23px;
              line-height: 23px;
              margin-bottom: 22px;
            }
          }
          .roadmap1Body{
            text-align: justify;
            padding: 0 211px 0px 53px;
            color: #FFFFFF;
            font-size: 16px;
            line-height: 24px;
            height: 118px;
            border-left: 1px dashed #30DAFF;
          }
        }
        .second{
          display: flex;
          flex-basis: 100%;
          .body{
            padding-left: 224px;

            .roadmap2Title{
              padding-right: 42px;
              color: #FFFFFF;
              font-size: 23px;
              line-height: 23px;
              margin-bottom: 0;
              text-align: right;
              border-right: 1px dashed #30DAFF ;
              padding-bottom: 22px;
            }
            .roadmap2Body{
              padding-right: 42px;
              text-align: justify;
              color: #FFFFFF;
              font-size: 16px;
              line-height: 24px;
              margin-bottom: 0;
              border-right: 1px solid #30DAFF;
              height: 72px;
            }
            .calcWidth{
              width: calc(100% - 24px);
            }
            .flexEnd{
              justify-content: end;
              justify-content: right;
            }
          }
        }
        .third{
          .roadmap3Title{
            padding-left: 53px;
            color: #FFFFFF;
            font-size: 23px;
            line-height: 23px;
            margin-bottom: 0;
            border-left: 1px dashed #30DAFF;
          }
          .roadmap3Body{
            height: 96px;
            padding-left: 53px;
            text-align: justify;
            color: #FFFFFF;
            font-size: 16px;
            line-height: 24px;
            margin-bottom: 0;
            padding-right: 211px;
            border-left: 1px solid #30DAFF;
          }
        }
      }

    }
    .thirdFloor{
      margin: 18px auto;
      flex-basis: 100%;
      background: #151C33;
      border: 1px solid #2A3661;
      border-radius: 12px;
      padding: 36px 50px 44px 50px;
      .thirdFloorTitle{
        color: #FFFFFF;
        font-size: 24px;
        line-height: 23px;
        margin-bottom: 25px;
      }
      .thirdFloorBody{
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        .thirdFloorItem{
          margin: 19px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 379px;
          height: 89px;
          border: 1px solid #273053;
          border-radius: 10px;
          text-align: center;
        }
      }
    }
    .fourFloor{
      margin: 18px auto;
      flex-basis: 100%;
      background: #151C33;
      border: 1px solid #2A3661;
      border-radius: 12px;
      padding: 36px 50px 44px 50px;
      .fourFloorTitle{
        color: #FFFFFF;
        font-size: 24px;
        line-height: 23px;
        margin-bottom: 25px;
      }
      .fourFloorBody{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        .fourFloorItem{
          margin: 19px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 379px;
          height: 89px;
          border: 1px solid #273053;
          border-radius: 10px;
          text-align: center;
        }
      }
    }
    .fifthFloor{
      margin: 18px auto;
      flex-basis: 100%;
      background: #151C33;
      border: 1px solid #2A3661;
      border-radius: 12px;
      padding: 36px 50px 44px 50px;
      .fifthFloorTitle{
        color: #FFFFFF;
        font-size: 24px;
        line-height: 23px;
        margin-bottom: 47px;
      }
      .fifthFloorBody{
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        .fifthFloorItem{
          margin: 19px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
      }
    }
  }
}
.aboutAPP{
  background:  #151726;
  flex: 1 1 auto;
  margin-bottom: 100px;
  .aboutTopAPP{
    background: #000214;
    height:296px;
    flex-basis: 100%;
    //background-image: url("../assets/APP_about_banner@3x.png");
    background-repeat: no-repeat;
    background-size:100% 100%;
    background-position: center center;
    display: flex;
    align-items: center;
    justify-content: center;
    .topBackgroundAPP{
      width: 100%;
      max-width: 375px;
      height: 296px;
      position: absolute;
      .backgroundImageAPP{
        background-image: url("../assets/APP_about_banner@3x.png");
        background-repeat: no-repeat;
        background-size:100% 100%;
        height: 296px;
      }
    }
    .aboutContextAPP{
      color: #FFFFFF;
      font-size: 12px;
      margin-bottom: 0;
      padding: 36px 0 20px 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      text-align: justify;
      -webkit-line-clamp: 6;
      overflow: hidden;
    }
    .topButton{
      border: 1px solid #17DCFF;
      border-radius: 29px;
      color: #FFFFFF;
    }
  }
  .aboutBottomAPP{
    margin: 0 16px;

    .firstFloorAPP{
      background: #151C33;
      border-radius: 18px ;
      padding-bottom: 25px;
      border: 1px solid #2A3661;
      .firstFloorTitle{
        border-radius: 18px 18px 0px 0px;
        padding: 15px 0 15px 15px;
        background: #242E56;
        color: #FFFFFF;
        font-size: 15px;
        line-height: 15px;
        margin-bottom: 0;
      }
      .firstFloorBody{
        align-items: center;
        justify-content: space-between;
        border: 1px solid #2A3661;
        border-radius: 10px;
        display: flex;
        margin: 0px 15px 0px 14px;
        .content{
          color: #FFFFFF;
          line-height: 18px;
          font-size: 12px;
          padding-right: 24px;
        }
      }
    }
    .secondFloorAPP{
      margin-top: 20px;
      border-radius: 18px;
      background: #151C33;
      border: 1px solid #2A3661;
      .secondFloorTitle{
        border-radius: 18px 18px 0px 0px;
        padding: 15px 0 15px 15px;
        background: #242E56;
        color: #FFFFFF;
        font-size: 15px;
        line-height: 15px;
        margin-bottom: 0;
      }
      .secondFloorBody{
        padding: 16px 12px 30px 18px;
        .roadmapStep1{
          display: flex;
          .step1{
            padding:11px 15px 0 4px;
            .roadmapStep1Title{
              color: #FFFFFF;
              font-size: 13px;
              line-height: 13px;
              margin-bottom:0;
              padding:0 0 10px 14px;
              border-left: 1px dashed #30DAFF ;
            }
            .roadmapStep1Content{
              text-align: justify;
              color: #9CB7F3;
              font-size: 11px;
              line-height: 14px;
              margin-bottom: 0;
              padding-left: 14px;
              border-left: 1px solid #145066;
              border-bottom: 1px solid #145066;
              border-radius: 0 0 0 20px;
              min-height: 73px;
            }
          }
        }
        .roadmapStep2{
          padding-top: 30px;
          display: flex;
          .step2{
            padding:13px 0 0 0;
            .roadmapStep2Title{
              text-align: right;
              color: #FFFFFF;
              font-size: 13px;
              line-height: 13px;
              margin-bottom:0;
              padding:0 8px 10px 0;
              border-right: 1px dashed #30DAFF ;
            }
            .roadmapStep2Content{
              text-align: justify;
              color: #9CB7F3;
              font-size: 11px;
              line-height: 14px;
              padding-right: 8px;
              margin-bottom: 0;
              border-right: 1px solid #145066;
              border-bottom: 1px solid #145066;
              border-radius: 0 0 20px 0;
              min-height: 72px;
            }
          }
        }
        .roadmapStep3{
          display: flex;
          padding-top: 32px;
          .step3{
            padding:11px 15px 0 6px;
            .roadmapStep3Title{
              color: #FFFFFF;
              font-size: 13px;
              line-height: 13px;
              padding-left: 6px;
              border-left: 1px dashed #30DAFF ;
              margin: 0;
              padding-bottom: 10px
            }
            .roadmapStep3Content{
              text-align: justify;
              color: #9CB7F3;
              font-size: 11px;
              line-height: 14px;
              margin-bottom: 0;
              min-height: 77px;
              border-left: 1px solid #145066;
              border-bottom: 1px solid #145066;
              border-radius: 0 0 0 20px;
              padding-left: 6px
            }
          }
        }
      }
    }
    .thirdFloorAPP {
      margin-top: 20px;
      border-radius: 18px;
      background: #151C33;
      border: 1px solid #2A3661;
      .thirdFloorTitle {
        border-radius: 18px 18px 0px 0px;
        padding: 15px 0 15px 15px;
        background: #242E56;
        color: #FFFFFF;
        font-size: 15px;
        line-height: 15px;
        margin-bottom: 0;
      }
      .thirdFloorBody{
        padding: 8px 15px 20px 14px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        .thirdFloorBodyItem{
          margin: 5px 0;
          border: 1px solid #2A3661;
          border-radius: 10px;
          width: 155px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
    .fourFloorAPP {
      margin-top: 20px;
      border-radius: 18px;
      background: #151C33;
      border: 1px solid #2A3661;
      .fourFloorTitle {
        border-radius: 18px 18px 0px 0px;
        padding: 15px 0 15px 15px;
        background: #242E56;
        color: #FFFFFF;
        font-size: 15px;
        line-height: 15px;
        margin-bottom: 0;
      }
      .fourFloorBody{
        padding: 8px 15px 20px 14px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        .fourFloorBodyItem{
          margin: 5px 10px;
          border: 1px solid #2A3661;
          border-radius: 10px;
          width: 155px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
    .fifthFloorAPP {
      margin-top: 20px;
      border-radius: 18px;
      background: #151C33;
      border: 1px solid #2A3661;
      .fifthFloorTitle {
        border-radius: 18px 18px 0px 0px;
        padding: 15px 0 15px 15px;
        background: #242E56;
        color: #FFFFFF;
        font-size: 15px;
        line-height: 15px;
        margin-bottom: 0;
      }
      .fifthFloorBody{
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 36px 0 53px 0;
      }
    }
  }
}
</style>