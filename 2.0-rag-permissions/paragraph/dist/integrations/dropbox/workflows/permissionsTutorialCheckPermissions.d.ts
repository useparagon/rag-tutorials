import { Workflow } from '@useparagon/core';
import { IContext } from '@useparagon/core/execution';
import { IPersona } from '@useparagon/core/persona';
import { ConditionalInput } from '@useparagon/core/steps/library/conditional';
import { IConnectUser, IPermissionContext } from '@useparagon/core/user';
import { IDropboxIntegration, InputResultMap } from '@useparagon/integrations/dropbox';
import personaMeta from '../../../persona.meta';
export default class extends Workflow<IDropboxIntegration, IPersona<typeof personaMeta>, InputResultMap> {
    define(integration: IDropboxIntegration, context: IContext<InputResultMap>, connectUser: IConnectUser<IPersona<typeof personaMeta>>): Promise<import("@useparagon/core").StateMachine>;
    name: string;
    description: string;
    inputs: {};
    defaultEnabled: boolean;
    hidden: boolean;
    definePermissions(connectUser: IPermissionContext<IPersona<typeof personaMeta>>): ConditionalInput | undefined;
    readonly id: string;
}
