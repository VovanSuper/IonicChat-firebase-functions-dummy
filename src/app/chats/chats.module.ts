import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ChatsPageRoutingModule } from './chats-routing.module';
import { ChatsPage } from './chats.page';
import { ChatPage } from './chat/chat.page';
import { CommonsModulesModule } from '@commons/commons.module';

@NgModule({
  imports: [
    CommonsModulesModule,
    ChatsPageRoutingModule
  ],
  declarations: [
    ChatsPage,
    ChatPage
  ]
})
export class ChatsPageModule { }
