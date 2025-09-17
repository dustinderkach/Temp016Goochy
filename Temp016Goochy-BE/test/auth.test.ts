import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { fetchAuthSession } from "@aws-amplify/auth";
import { AuthService } from "./AuthService";


async function testAuth(){
    const service = new AuthService();
    const loginResult = await service.login(
        'Goo',
        'Goochy1,Goo'
    )
    const idToken = (await fetchAuthSession()).tokens.idToken?.toString() as string;

    console.log("JWT: " + idToken);
    // const credentials = await service.generateTemporaryCredentials();
    // const buckets = await listBuckets(credentials);
    // const a = 4;

}

async function listBuckets(credentials: any){
    const client = new S3Client({
        credentials: credentials
    });
    const command = new ListBucketsCommand({});
    const result = await client.send(command);
    return result;
}

testAuth();