import athletico from '@/assets/team-crests/athletico-paranaense.png.asset.json';
import atletico from '@/assets/team-crests/atletico-mineiro.png.asset.json';
import bahia from '@/assets/team-crests/bahia.png.asset.json';
import botafogo from '@/assets/team-crests/botafogo.png.asset.json';
import bragantino from '@/assets/team-crests/bragantino.png.asset.json';
import corinthians from '@/assets/team-crests/corinthians.png.asset.json';
import chapecoense from '@/assets/team-crests/chapecoense.png.asset.json';
import coritiba from '@/assets/team-crests/coritiba.png.asset.json';
import cruzeiro from '@/assets/team-crests/cruzeiro.png.asset.json';
import flamengo from '@/assets/team-crests/flamengo.png.asset.json';
import fluminense from '@/assets/team-crests/fluminense.png.asset.json';
import gremio from '@/assets/team-crests/gremio.png.asset.json';
import internacional from '@/assets/team-crests/internacional.png.asset.json';
import mirassol from '@/assets/team-crests/mirassol.png.asset.json';
import palmeiras from '@/assets/team-crests/palmeiras.png.asset.json';
import remo from '@/assets/team-crests/remo.png.asset.json';
import saoPaulo from '@/assets/team-crests/sao-paulo.png.asset.json';
import santos from '@/assets/team-crests/santos.png.asset.json';
import vasco from '@/assets/team-crests/vasco.png.asset.json';
import vitoria from '@/assets/team-crests/vitoria.png.asset.json';
import archive from '@/assets/team-crests/escudos-serie-a.zip.asset.json';

export const TEAM_CRESTS: Record<string, string> = {
  'ATHLETICO PARANAENSE': athletico.url,
  'ATLÉTICO MINEIRO': atletico.url,
  BAHIA: bahia.url,
  BOTAFOGO: botafogo.url,
  BRAGANTINO: bragantino.url,
  CORINTHIANS: corinthians.url,
  CHAPECOENSE: chapecoense.url,
  CORITIBA: coritiba.url,
  CRUZEIRO: cruzeiro.url,
  FLAMENGO: flamengo.url,
  FLUMINENSE: fluminense.url,
  GRÊMIO: gremio.url,
  INTERNACIONAL: internacional.url,
  MIRASSOL: mirassol.url,
  PALMEIRAS: palmeiras.url,
  REMO: remo.url,
  'SÃO PAULO': saoPaulo.url,
  SANTOS: santos.url,
  VASCO: vasco.url,
  VITÓRIA: vitoria.url,
};

export function getTeamCrest(name: string): string | undefined {
  return TEAM_CRESTS[name.trim().toUpperCase()];
}

export const TEAM_CRESTS_DOWNLOAD = archive.url;
