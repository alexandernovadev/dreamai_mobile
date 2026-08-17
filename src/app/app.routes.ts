import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { DreamEditor } from './pages/dream-editor/dream-editor';
import { DreamViewPage } from './pages/dream-view/dream-view-page';
import { SignalsHub } from './pages/signals-hub/signals-hub';
import { SignalsList } from './pages/signals-list/signals-list';
import { SignalsEntityEdit } from './pages/signals-entity-edit/signals-entity-edit';
import { Summarize } from './pages/summarize/summarize';
import { MoreHub } from './pages/more-hub/more-hub';
import { SystemInfo } from './pages/system-info/system-info';
import { DreamStats } from './pages/dream-stats/dream-stats';
import { ComingSoon } from './pages/coming-soon/coming-soon';

export const routes: Routes = [
  { path: '', component: Home },

  // Static segments before any `:id`/`:kind` catch-all, or a literal path
  // segment like "new" would get parsed as a param instead.
  { path: 'dreams/new', component: DreamEditor },
  { path: 'dreams/:id/edit', component: DreamEditor },
  { path: 'dreams/:id', component: DreamViewPage },

  { path: 'signals', component: SignalsHub },
  { path: 'signals/:kind', component: SignalsList },
  { path: 'signals/:kind/:id', component: SignalsEntityEdit },

  { path: 'summarize', component: Summarize },
  { path: 'stats', component: DreamStats },

  { path: 'more', component: MoreHub },
  { path: 'more/system-info', component: SystemInfo },
  { path: 'more/alerts', component: ComingSoon, data: { title: 'Alertas' } },
  { path: 'more/totem', component: ComingSoon, data: { title: 'Totem' } },
  { path: 'more/audio-cues', component: ComingSoon, data: { title: 'Audio cues' } },
];
