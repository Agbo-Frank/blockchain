import { Network } from "alchemy-sdk";
import Token from "./token";

const address1 = "0x02EAc949Fad1b4d196601A6F4B8109f289581b3A";
const pk2 = "767afe9de161331a63a5ff22a4040e8d3495db6dff228e9244ebd8a2ceaf063d"
const pk1 = "01a259afd2d8c23a8a667d9817edd5b63d10b6ab9a4eaf0e9d105d6ca28aae30"
const address2 = "0x3f87EaB228F58202D1f024A79A6986465CE37D21";
const token_address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const payload = {
    [Network.ETH_SEPOLIA]: {
        from: "0x02EAc949Fad1b4d196601A6F4B8109f289581b3A",
        to: "0x3f87EaB228F58202D1f024A79A6986465CE37D21",
        from_pk: "01a259afd2d8c23a8a667d9817edd5b63d10b6ab9a4eaf0e9d105d6ca28aae30",
        to_pk: "767afe9de161331a63a5ff22a4040e8d3495db6dff228e9244ebd8a2ceaf063d",

    }
};

(async () => {
const token = new Token(Network.ETH_SEPOLIA)
const _payload = payload[Network.ETH_SEPOLIA]
// console.log(await token.getBalance(_payload.from, ["0x6D2B5c68F1506d4dCB49320D7D9Cc7e8375aC1d0"]))
// const result = await token.transfer({
//     token_address: "0x6D2B5c68F1506d4dCB49320D7D9Cc7e8375aC1d0",
//     amount: "1",
//     recipent: _payload.to
// })
const result = await token.getPoolAddress()
console.log("result: ", result)
// console.log(token.getChildAddress(0))
})()