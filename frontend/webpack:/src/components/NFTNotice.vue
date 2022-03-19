<template>
  <div class="gt-sm">
    <q-dialog class="gt-sm"
              title="Notice"
              v-model="nftNoticeVisible"
              width="416.4px"
              center>
      <q-card class="wallet">
        <q-card-section class="row items-center walletTitle" >
          <div style="font-size: 20px;padding-left: 145px">Larix NFTs</div>
          <q-space />
          <q-btn icon="close" flat round v-close-popup style="background: #7244B9" />
        </q-card-section>
        <q-card-section class="walletBody">
          <div class="select-wallet" style="text-align: center;font-size: 24px;color: white">
            Coming Soon
          </div>

        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import {defineComponent} from "vue";

export default defineComponent({
  name: "NFTNotice",
  data(){
    return{

    }
  },
  computed:{
    nftNoticeVisible:{
      get() {
        return this.$store.state.dialog.nftNoticeVisible
      },
      set(value) {
        this.$store.commit('updateNFTNoticeVisible',value)
      }
    },
  },
})
</script>

<style scoped lang="scss">
.wallet{
  width: 416.4px;
  border-radius:  18px!important;
  .walletTitle{
    font-size: 19px;
    line-height: 19px;
    color: #FFFFFF;
    background: linear-gradient(90deg, #00E6FE, #C933FF);

  }
  .walletBody{
    border: 1px solid #1B7CFF;
    background: #1C2442;
    padding: 73px 24px 93px 24px!important;
    .select-wallet {
      .button {
        width: 100%;
        height: 62.4px;
        border-radius: 39px;
        color: #FFFFFF;
        background: #2B3866;
        border: 0;
        font-size: 16px;
        display: flex;
        cursor: pointer;

        .left {
          padding-left: 10px;
          transform: translateY(8%);
        }

        .right {
          margin: auto;
          transform: translateX(-25px);
        }
      }

      .button:not(:first-child) {
        margin-top: 9.6px;
        margin-left: 0px;
      }
    }
    .wallet-info {
      text-align: center;
      .button {
        width: 100%;
        height: 62.4px;
        color: #FFFFFF;
        border-radius: 39px;
        background: #2B3866;
        border: 0;
        font-size: 16px;
        text-align: center;
      }
      >button:last-child{
        margin-top: 10px;
      }
      .address {
        font-size: 12.8px;
        text-align: center;
        color: #A1B7EE;
      }
    }
  }
}
::v-deep .material-icons {
  font-family: 'Material Icons' !important;
}
</style>