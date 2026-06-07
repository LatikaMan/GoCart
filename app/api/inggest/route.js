import {server} from "<inngest/nest";
import { Inngest } from "../../../inngest/client"   ;
import {syncUserCreation, syncUserUpdate, syncUserDeletion , deleteCouponOnExpiry} from "@/inngest/functions";

export const {GET , POST , PUT} = server({
    client : Inngest,
    functions : [syncUserCreation ,
        syncUserUpdate ,
         syncUserDeletion,
         deleteCouponOnExpiry
        ],
})
