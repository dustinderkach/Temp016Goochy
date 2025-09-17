import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssmClient = new SSMClient({ region: "us-east-1" }); // Change the region as needed

export async function getParameter(name: string): Promise<string> {
    const command = new GetParameterCommand({ Name: name });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || "";
}