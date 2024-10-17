"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const paragonTutorialInitialChannelSync_1 = tslib_1.__importDefault(require("./workflows/paragonTutorialInitialChannelSync"));
const paragonTutorialNewMessageSync_1 = tslib_1.__importDefault(require("./workflows/paragonTutorialNewMessageSync"));
const config = {
    description: 'Send notifications to Slack',
    overviewText: `Connect your Slack workspace to receive notifications and alerts in Slack. Stay connected to important activity by bringing it all together in your Slack workspace.
       

Our Slack integration enables you to:
   

• Receive alerts and notifications in your Slack workspace
• Notify or DM specific team members based on certain activity`,
    showWatermark: true,
    workflowDisplayOrder: [
        paragonTutorialInitialChannelSync_1.default,
        paragonTutorialNewMessageSync_1.default,
    ],
};
exports.default = config;
//# sourceMappingURL=config.js.map