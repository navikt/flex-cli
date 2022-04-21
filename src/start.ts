import {request} from "@octokit/request"
import prompts from "prompts";

const a = await request("GET /repos/{owner}/{repo}/pulls", {
    owner: "navikt",
    repo: "spinnsyn-backend",
})


const choices = a.data.map((it) => {
    return {
        title: it.title,
        value: {title: it.title}
    }
})

const response = await prompts([
    {
        type: 'multiselect',
        name: 'color',
        message: 'Godkjenn PRs',
        choices
    }
]);

console.log(response.color);


