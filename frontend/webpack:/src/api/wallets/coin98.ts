import {
    BaseSignerWalletAdapter,
    scopePollingDetectionStrategy,
    WalletAccountError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletPublicKeyError,
    WalletReadyState,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';

interface Coin98Wallet {
    isCoin98?: boolean;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    isConnected(): boolean;
    connect(): Promise<string[]>;
    disconnect(): Promise<void>;
    request(params: { method: string; params: string | string[] | unknown }): Promise<{
        signature: string;
        publicKey: string;
    }>;
}

interface Coin98Window extends Window {
    coin98?: {
        sol?: Coin98Wallet;
    };
}

declare const window: Coin98Window;

export interface Coin98WalletAdapterConfig {}

export const Coin98WalletName = 'Coin98' as WalletName;

export class Coin98WalletAdapter extends BaseSignerWalletAdapter {
    name = Coin98WalletName;
    url = 'https://coin98.com';
    icon =
        'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjQyIiB3aWR0aD0iNDIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTgwLjE1NiAyNy4zMDVjLS44NzEtLjM0Mi0xLjYyNy0uODU1LTIuMzI0LTEuNTQtLjY0LS42ODUtMS4xNjMtMS40MjctMS41Ny0yLjI4My0uMzQ4LS44NTYtLjU4LTEuODI2LS41OC0yLjc5NnMuMTc0LTEuODgzLjU4LTIuNzk2Yy4zNS0uODU2Ljg3Mi0xLjU5OCAxLjU3LTIuMjgyLjYzOS0uNjI4IDEuNDUzLTEuMTQxIDIuMzI0LTEuNTQuODcyLS4zNDMgMS44Ni0uNTcyIDIuODQ4LS41NzJzMS45MTguMTcyIDIuODQ4LjU3MWMuODcyLjM0MiAxLjYyNy44NTYgMi4yNjYgMS41NC42NC42MjkgMS4xNjMgMS40MjcgMS41MTIgMi4yODMuNDA2LjkxMy41OCAxLjgyNi41OCAyLjc5NnMtLjE3NCAxLjg4My0uNTggMi43OTZjLS4zNS44NTYtLjg3MiAxLjU5OC0xLjU3IDIuMjgzLS42OTcuNjI3LTEuNDUzIDEuMTQxLTIuMzI0IDEuNTQtLjg3Mi4zNDMtMS44Ni41NzEtMi44NDguNTcxLS45MyAwLTEuODYtLjE3MS0yLjczMi0uNTd6bS0xLjA0Ni0xNS41MmMtMS4xNjIuNTEzLTIuMjY2IDEuMTk4LTMuMTM4IDIuMTExLS45My45MTMtMS42MjcgMS45NC0yLjE1IDMuMDgxLS41MjMgMS4xOTktLjc1NiAyLjQ1NC0uNzU2IDMuNzY2IDAgMS4zMTMuMjMzIDIuNTY4Ljc1NSAzLjc2Ni41MjQgMS4xNDIgMS4yMjEgMi4yMjYgMi4xNSAzLjA4Mi45My45MTMgMS45NzcgMS41OTcgMy4xNCAyLjExMSAxLjIyLjUxMyAyLjQ5OC43NDIgMy44MzUuNzQyczIuNjE1LS4yMjkgMy44MzYtLjc0MmMxLjE2Mi0uNTE0IDIuMjY2LTEuMTk4IDMuMTM4LTIuMTExLjkzLS45MTMgMS42MjctMS45NCAyLjE1LTMuMDgyLjUyNC0xLjE5OC43NTYtMi40NTMuNzU2LTMuNzY2IDAtMS4zMTItLjIzMi0yLjU2Ny0uNzU1LTMuNzY2LS41MjQtMS4xNC0xLjIyMS0yLjIyNS0yLjE1LTMuMDgxLS45My0uOTEzLTEuOTc3LTEuNTk4LTMuMTQtMi4xMTEtMS4yMi0uNTE0LTIuNDk4LS43NDItMy44MzUtLjc0MnMtMi42MTUuMjI4LTMuODM2Ljc0MnptLTIxLjA5NiAwYy0xLjE2My41MTMtMi4yNjcgMS4xOTgtMy4xMzkgMi4xMTEtLjk4OC44NTYtMS42ODUgMS45NC0yLjE1IDMuMDgxLS41MjMgMS4xOTktLjc1NiAyLjUxMS0uNzU2IDMuNzY2IDAgMS4zMTMuMjkgMi41NjguNzU2IDMuODIzLjQ2NSAxLjE0MiAxLjIyIDIuMTY5IDIuMTUgMy4wODJzMS45NzYgMS41OTggMy4xMzkgMi4xMTFjMS4yMi41MTQgMi41NTcuNzQyIDMuODM1Ljc0MiAxLjMzNyAwIDIuNjE2LS4yODYgMy44MzYtLjc0MiAxLjIyLS41MTQgMi4yNjctMS4xOTggMy4xMzgtMi4wNTQuOTMtLjkxMyAxLjYyOC0xLjk0IDIuMTUtMy4xMzkuMTE3LS4yMjguMjMzLS41MTMuMjkxLS43OThoLTIuOTA2Yy0uMzQ4Ljc0MS0uODEzIDEuNDI2LTEuNDUzIDIuMDU0LS42MzkuNjI4LTEuNDUyIDEuMTQxLTIuMzI0IDEuNTQtLjg3Mi4zNDMtMS44Ni41NzEtMi44NDguNTcxcy0xLjkxOC0uMTcxLTIuNzktLjU3Yy0uODcxLS4zNDMtMS42MjctLjg1Ny0yLjMyNC0xLjU0MS0uNjQtLjY4NS0xLjE2My0xLjQyNy0xLjU3LTIuMjgzLS4zNDgtLjg1Ni0uNTgtMS44MjYtLjU4LTIuNzk2cy4xNzQtMS44ODMuNTgtMi43OTZjLjM1LS44NTYuODcyLTEuNTk3IDEuNTctMi4yODIuNjM5LS42MjggMS40NTMtMS4xNDEgMi4zMjQtMS41NC44NzItLjM0MyAxLjg2LS41NzEgMi44NDgtLjU3MXMxLjkxOC4xNyAyLjg0OC41N2MuODcyLjM0MyAxLjYyNy44NTYgMi4zMjUgMS41NC41OC41NzIgMS4wNDYgMS4yNTYgMS40NTMgMi4wNTVoMi45MDZjLS4wNTktLjI4NS0uMTc1LS41MTQtLjI5MS0uNzk5LS41MjMtMS4xNDEtMS4yMi0yLjIyNS0yLjE1LTMuMDgxLS44NzItLjg1Ni0xLjk3Ny0xLjU5OC0zLjEzOS0yLjExMS0xLjIyLS41MTQtMi40OTktLjc0Mi0zLjgzNi0uNzQyLTEuMzk0LjA1Ny0yLjczMS4yODUtMy44OTMuNzk5em0zNy44OTIgMTguNzE1aDIuNjc0di0xOS40NTdoLTIuNjc0em0zMy4wNjktMTIuNjFjMC0yLjU2OCAyLjE1MS00LjY4IDQuNzY2LTQuNjhzNC43MDcgMi4xMTEgNC43MDcgNC42OGMwIDIuNTEtMi4wOTIgNC42MjEtNC43MDcgNC42MjEtMi42NzMgMC00Ljc2Ni0yLjA1NC00Ljc2Ni00LjYyMnptLTIuMzgzLjA1NmMwIDMuODIzIDMuMTk3IDYuNzkgNy4yNjUgNi43OWgxLjYyN2wtMy4xMzggNS44NzhoMi42NzRsNC45NC05LjI0NGMuNjk3LTEuMjU1Ljk4OC0yLjM5Ny45ODgtMy40OCAwLTMuODI0LTMuMTM5LTYuODQ4LTcuMTQ5LTYuODQ4LTQuMDY4LS4wNTctNy4yMDcgMy4wMjQtNy4yMDcgNi45MDR6bTE4Ljk0NyA2Ljc5YzAtMi4yMjUgMS44Ni0zLjk5NCA0LjEyNi0zLjk5NCAyLjMyNSAwIDQuMTg1IDEuNzcgNC4xODUgMy45OTVzLTEuODYgNC4wNTEtNC4xODUgNC4wNTEtNC4xMjYtMS44MjYtNC4xMjYtNC4wNTF6bTEuMzM3LTguOWMwLTEuNDg1IDEuMjItMi43NCAyLjczMS0yLjc0czIuNzkgMS4yNTUgMi43OSAyLjc0YzAgMS40ODMtMS4yNzkgMi43MzgtMi43OSAyLjczOC0xLjQ1MyAwLTIuNzMxLTEuMjU1LTIuNzMxLTIuNzM5em0tMi4yMDkgMGMwIDEuMDgzLjM0OSAyLjExLjk4OCAyLjk2NmwuNTIzLjc0Mi0uNjk3LjU3Yy0xLjM5NSAxLjE0Mi0yLjIwOSAyLjg1NC0yLjIwOSA0LjYyMyAwIDMuNDIzIDIuODQ4IDYuMjIgNi4zMzUgNi4yMiAzLjU0NSAwIDYuMzkzLTIuNzk3IDYuMzkzLTYuMjIgMC0xLjgyNi0uODE0LTMuNDgxLTIuMjA4LTQuNjhsLS42OTgtLjU3LjU4MS0uNzQyYy42NC0uNzk5Ljk4OC0xLjgyNi45ODgtMi45MSAwLTIuNjgyLTIuMjA4LTQuNzkzLTQuOTk4LTQuNzkzLTIuODQ4LS4wNTctNC45OTggMi4wNTQtNC45OTggNC43OTN6bS0yNC41MjYtNC43OTR2MTUuMTIxYzAgLjg1Ni0uNDY1IDEuMzctMS4yNzggMS40MjctLjgxNCAwLTEuMjc5LS42MjgtMS40NTMtLjk3bC02LjEwMy0xMi45NTNjLS4zNDgtLjgtLjg3MS0xLjQyNy0xLjYyNy0xLjk0LS42OTctLjQ1Ny0xLjUxMS0uNjg1LTIuMzgzLS42ODUtMS4wNDYgMC0xLjk3Ni4zNDItMi43MzEuOTEzLS4wNTggMC0uMDU4LjA1Ny0uMTE2LjA1Ny0uODcyLjc0Mi0xLjI3OSAxLjY1NS0xLjI3OSAyLjczOXYxNS43NDloMi44NDh2LTE1LjM1YzAtLjc5OS41ODEtMS4zNyAxLjMzNi0xLjM3LjU4MiAwIDEuMTA1LjM0MyAxLjQ1MyAxLjAyOGwuMDU5LjExNGMxLjQ1MiAzLjEzOCA0LjY0OSA5Ljk4NiA2LjU2NyAxMy42MzguNjM5IDEuMTk4IDEuNzQzIDEuNzY5IDMuNDg3IDEuNzY5IDEuMDQ2IDAgMi4wMzQtLjI4NiAyLjc5LS45MTMuODcxLS42ODUgMS4zMzYtMS4yNTYgMS4zMzYtMi42MjV2LTE1Ljc1aC0yLjkwNnptLTg1Ljg0LTEwLjA0MmgtMjUuODYxYy00LjEyNyAwLTcuNDQgMy4yNTItNy40NCA3LjMwNHYyNS4zOTJjMCA0LjA1MiAzLjMxMyA3LjMwNCA3LjQ0IDcuMzA0aDI1Ljg2YzQuMDY5IDAgNy40NC0zLjI1MiA3LjQ0LTcuMzA0di0yNS4zOTJjMC00LjA1Mi0zLjMxMy03LjMwNC03LjQ0LTcuMzA0aC4wMDF6bS02LjI3NiA5Ljk4NmMzLjAyMiAwIDUuNDYzIDIuMzk2IDUuNDYzIDUuMzY0IDAgLjkxMi0uMjMzIDEuNzY4LS42NCAyLjU2Ny0uNjk3LS41MTMtMS40NTItLjk3LTIuMjY2LTEuMjU1LjIzMi0uNC4zNDktLjg1Ni4zNDktMS4zMTIgMC0xLjU0MS0xLjI3OS0yLjc5Ni0yLjg0OC0yLjc5Ni0xLjU3IDAtMi44NDggMS4yNTUtMi44NDggMi43OTYgMCAuNDU2LjExNi45MTIuMzQ5IDEuMzEyLS44MTQuMjg1LTEuNjI4LjY4NS0yLjI2NyAxLjI1NS0uNDY1LS43OTktLjY0LTEuNjU1LS42NC0yLjU2OC0uMTE1LTIuOTY3IDIuMzI2LTUuMzYzIDUuMzQ4LTUuMzYzem0tMTMuMzEgMjAuMDI4Yy0zLjAyMSAwLTUuNDYyLTIuMzk2LTUuNDYyLTUuMzYzaDIuNjE1YzAgMS41NCAxLjI3OSAyLjc5NiAyLjg0OCAyLjc5NnMyLjg0OC0xLjI1NiAyLjg0OC0yLjc5NmgyLjYxNWMwIDIuOTY3LTIuNDQxIDUuMzYzLTUuNDYzIDUuMzYzem0wLTcuNTMyYy0zLjQ4NiAwLTYuMzM0LTIuNzk2LTYuMzM0LTYuMjIgMC0zLjQyMyAyLjg0OC02LjI3NiA2LjMzNS02LjI3NnM2LjM5MyAyLjc5NiA2LjM5MyA2LjI3NmMtLjA1OCAzLjQyNC0yLjkwNiA2LjIyLTYuMzkzIDYuMjJ6bTEzLjMxIDcuNTMyYy0zLjQ4NyAwLTYuMzkzLTIuNzk2LTYuMzkzLTYuMjIgMC0zLjQ4IDIuODQ4LTYuMjc2IDYuMzkzLTYuMjc2IDMuNDg3IDAgNi4zMzUgMi43OTYgNi4zMzUgNi4yNzcgMCAzLjQyMy0yLjg0OCA2LjIyLTYuMzM1IDYuMjJ6bTMuNzc3LTYuMjc2YzAgMi4wNTQtMS42ODUgMy42NTEtMy43NzcgMy42NTFzLTMuNzc4LTEuNjU0LTMuNzc4LTMuNjUxYzAtMi4wNTUgMS42ODYtMy43MSAzLjc3OC0zLjcxIDIuMDkyLjA1OCAzLjc3NyAxLjcxMiAzLjc3NyAzLjcxem0tMTMuMzY3LTcuNDc2YzAgMi4wNTUtMS42ODUgMy43MS0zLjc3NyAzLjcxLTIuMDkzIDAtMy43NzgtMS42NTUtMy43NzgtMy43MSAwLTIuMDU0IDEuNjg1LTMuNzA5IDMuNzc4LTMuNzA5IDIuMTUgMCAzLjc3NyAxLjY1NSAzLjc3NyAzLjcxeiIgZmlsbD0iI2Q5YjQzMiIvPjwvc3ZnPg==';

    private _connecting: boolean;
    private _wallet: Coin98Wallet | null;
    private _publicKey: PublicKey | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor(config: Coin98WalletAdapterConfig = {}) {
        super();
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (window.coin98?.sol) {
                    this._readyState = WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
        }
    }

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }

    get connecting(): boolean {
        return this._connecting;
    }

    get connected(): boolean {
        return !!this._wallet?.isConnected();
    }

    get readyState(): WalletReadyState {
        return this._readyState;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            // if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();

            this._connecting = true;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window!.coin98!.sol!;

            let account: string;
            try {
                [account] = await wallet.connect();
            } catch (error: any) {
                throw new WalletAccountError(error?.message, error);
            }

            let publicKey: PublicKey;
            try {
                publicKey = new PublicKey(account);
            } catch (error: any) {
                throw new WalletPublicKeyError(error?.message, error);
            }

            this._wallet = wallet;
            this._publicKey = publicKey;

            this.emit('connect', publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            this._wallet = null;
            this._publicKey = null;

            await wallet.disconnect();
        }

        this.emit('disconnect');
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                const response = await wallet.request({ method: 'sol_sign', params: [transaction] });

                const publicKey = new PublicKey(response.publicKey);
                const signature = bs58.decode(response.signature);

                transaction.addSignature(publicKey, signature);
                return transaction;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        const signedTransactions: Transaction[] = [];
        for (const transaction of transactions) {
            signedTransactions.push(await this.signTransaction(transaction));
        }
        return signedTransactions;
    }
}