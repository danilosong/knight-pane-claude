import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit, Task, Totals } from '../types'

const PANE = 'knight-pane'
const busy = atom({ plugin: 'knight-pane', key: 'busy' } as const, false)
const tasks = atom({ plugin: 'knight-pane', key: 'tasks' } as const, [] as Task[])
const tool = atom({ plugin: 'knight-pane', key: 'tool' } as const, '')
const frame = atom({ plugin: 'knight-pane', key: 'frame' } as const, 0)
const limits = atom({ plugin: 'knight-pane', key: 'limits' } as const, [] as Limit[])
const usd = atom({ plugin: 'knight-pane', key: 'usd' } as const, 0)
const totals = atom({ plugin: 'knight-pane', key: 'totals' } as const, { input: 0, output: 0, cache: 0, missions: 0 } as Totals)

// 35x30 dark knight: one row of four frames per mood, in MOOD_ORDER.
// '.' is transparent; letters index PALETTE.
const PALETTE: Record<string, string> = {'a':  '#1b172b', 'b':  '#670e22', 'c':  '#259de2', 'd':  '#113150', 'e':  '#234862', 'f':  '#17689e', 'g':  '#526270', 'h':  '#91a1ac', 'i':  '#64728b', 'j':  '#8e1cd5', 'k':  '#dddae6', 'l':  '#5f0d50', 'm':  '#708a98', 'n':  '#ed9d0d', 'o':  '#9a1123', 'p':  '#7907c6', 'q':  '#d2a0ee', 'r':  '#2587b5', 's':  '#af5be2', 't':  '#1378cb', 'u':  '#a2076f', 'v':  '#6e0ab2', 'w':  '#b3b1c8', 'x':  '#e87402', 'y':  '#f7d123', 'z':  '#f7d75c', 'A':  '#49acdb', 'B':  '#972791', 'C':  '#f8e49f', 'D':  '#6a5412', 'E':  '#c677ef', 'F':  '#9f6916', 'G':  '#d2068c', 'H':  '#8a5689', 'I':  '#a98d50', 'J':  '#44c0f9', 'K':  '#bcc1cf', 'L':  '#3ec0f9', 'M':  '#8a7e6f', 'N':  '#c3017e', 'O':  '#d1bc7d', 'P':  '#040616', 'Q':  '#a81324', 'R':  '#1a2635', 'S':  '#0b1324', 'T':  '#283746', 'U':  '#131a2a', 'V':  '#354758', 'W':  '#010105', 'X':  '#170617', 'Y':  '#560d27', 'Z':  '#270718', '0':  '#981224', '1':  '#4a0d25', '2':  '#fafafa', '3':  '#212c3b', '4':  '#370919', '5':  '#871123', '6':  '#445968', '7':  '#460a1a', '8':  '#070c21', '9':  '#3c5263'}
const MOOD_ORDER = ['idle', 'think', 'fight', 'forge', 'search', 'spell'] as const
const FRAMES: string[][][] = [
  [
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '............8..........PW..........',
      '...........dcP..PPPP..Pdf..........',
      '..........PdcPPPSUTRPP8efP.........',
      '..........8ccP8URRV9TSPecS.........',
      '..........ScceSR3RT6gVSdcU.........',
      '..........8tccPRVT3gh63ecU.........',
      '..........PSctPR9636wm9RSP.........',
      '...........8ffPSR3U6wm63P....PPP...',
      '...........PP8SUPllVhmgRP...PP8P...',
      '............PS3V3llPP1uP...PP88P...',
      '............XXUV6V6RP3VPP.PP88P....',
      '..........PXYY7RVmhV8ihPPP888P.....',
      '..........X1Ybo7YV6RPVV7X888P......',
      '.........XYbXX5QQbY7YYY5X88P.......',
      '........X55ZSTX7YQQQQQb4SPP........',
      '......P4o01SfrdPR14444X8cUP........',
      '......PQQY4dcJe8TTTTTTRPAmP........',
      '......P5b14UfmTSRV999VR8g6P........',
      '......PXX118TVSSURRR3RU8T3P........',
      '........P47XPP8TVUSSSTVSPP.........',
      '........PZPPP83VT8PPST93P..........',
      '........PP..PSTTSP..PUTTSP.........',
      '............PPPPP...PPPPPP.........',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.........8P...........P............',
      '.........dtP..PPPP...StP...........',
      '.........er8PPSUTTPP8UcP...........',
      '........dtcP8UURV9VUPSLeP..........',
      '........dccePRTT36g6RScfP..........',
      '.......PdcLcP3VV3ghiTUcfP..........',
      '........PdctP3T63ghm9T8PP....P.....',
      '.........UffP8PPP6hm6TPP....PPP....',
      '.........PP8R3PNuR6HBaP...PP88P....',
      '..........PSRTVS8PPalPP..PP88P.....',
      '.........PX48T6imTPgmSP.PP88PP.....',
      '........PZbQ58UmhT8hm8XPP88PP......',
      '.......PZYbQQ00X8PPU8b7P88PP.......',
      '......P75YZZbQQ0000o0oZP8PP........',
      '.....PY054UV8175QQQQYZUUPP.........',
      '.....7Q018ere8Ra4ZZZa8frU..........',
      '....40QY1UtJfPTVTTTTTPrmVP.........',
      '...P7Q514SrmVPRV999VTP9g3P.........',
      '...P7b114PTVUSUR3R33R83T8P.........',
      '...PXZP41XPPPRVTSSSRVRPPP..........',
      '......PXXPPPUTVTPPP3VVSP...........',
      '.......P...PRT3PP.P83T3P...........',
      '...........PPPPP...PPPPP...........',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...P...............................',
      '..PU8....PP..........P.............',
      '..PUUP..Prd...PPPP..Pfd............',
      '..PST8..8cdP8PUTTUP8Prd............',
      '...P3UPPfLdPUURTVVTPPrtP...........',
      '...PU38PtLfUR3TRVggVPfc8...........',
      '....P33PtcLdUTVTVmm6SrcP...........',
      '....PUT8PtcdST6VVmh6VS8P...........',
      '.....P338ffR88US3mw69UP............',
      '.....P8U8P8SRS1ua6gBlS.............',
      '.....P839P8RTTTlXPPlZP.............',
      '.....PP6mTXaT99igPRgTP.............',
      '......PT9T1ba36hmPVhVXP............',
      '.......8UR4QbY1TRPU31YXP...........',
      '.......P48XbQQo55b55obXP...........',
      '......P7bZUa775QQQQ57S8P...........',
      '......ZobZRVPS34744ZPfcU...........',
      '.....X0518frP3VTTTT3PrhiP..........',
      '....P5QY48cJPRT9999TP6g6P..........',
      '....PQY148tc8RR3R3RSPTV3P..........',
      '....P7P41PP8UVTSSS3VSPPP...........',
      '.......XXP8RVVUPP83V38.............',
      '.......P.PS3TRP..PSTTSP............',
      '.........PPPPPP..PPPPPP............',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.......P...........P...............',
      '......drP..PPPP...UfP..............',
      '......dcP.PSUTT8P8UcP..............',
      '.....UrcP8UU3V9VRPUceP.............',
      '.....dcceSRT3T6g9RUcfP.............',
      '.....dtccPRVV3ghgVRcfP.............',
      '.....PdctPRVgTgwm938PP.............',
      '......Sff8SU3Ugwh6TP...............',
      '......PP8URPllTiiBRP.....PPP.......',
      '.......PURTTll8PXlXP....P88P.......',
      '.......PXST66i3PTiSP..PP88PP.......',
      '......PY5bU3ihVPghSPPPP88PP........',
      '.....P4bQQbb33SPR3Y4P888PP.........',
      '....P7bY77QQ5b555504P8PPP..........',
      '...P70bZSRZ70QQQQb4S8PP............',
      '..PYQ07Pe6R844444XSceP.............',
      '..7oQb4RtLf8TTTTTRSAmR.............',
      '.Z0Q51ZdcAgPT999VRSigU.............',
      'PYQ0Y1Z8V6RSRRRRRS8VTP.............',
      'P77PZ14PPP8TRSS8TVUPP..............',
      'PP..PZPP8RTTSPPST9TP...............',
      '....PP.PU3TSP..PSTTUP..............',
      '.......PPPPP...PPPPPP..............',
      '...................................',
    ],
  ],
  [
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '............PP...........W.........',
      '............deP..PPPP...PfP........',
      '...........PerP.PPSUU8P.PcP........',
      '...........drrP88URVVTSPPcdP.......',
      '..........PecrdSR33T69VUPLfP.......',
      '..........PdcLrPRVV36igVWcfP.......',
      '...........RfcrPRV636hm9UeRP.......',
      '...........8dtf8UU3Rgwm63PP........',
      '........xx..PPPUS8l4Vwmg3P.........',
      '.......xyn..P8U3Taul88lNP8...PPP...',
      '.......xyn..PPSRV63388aUP...PP8P...',
      '...........PX1YZ39hh8SmiPP.PP88P...',
      '...........XY5Q541gg88gVZPP888P....',
      '..........XY1Y5QQo77777Y5P88PP.....',
      '.........XYbZSX7QQQQQQQQbP8PP......',
      '........XY5489TPPXo0o05PUdPP.......',
      '.......PYQbPerr8R98PPPSUerU........',
      '......P7QbYPtcrP3999669Uem6P.......',
      '......XQQ11P9igPUUVVVVR836VP.......',
      '......X0b1YXRVRP3RRRRRRSUTUP.......',
      '......P7P41ZPPPRVTS88UV3PPP........',
      '......P..XXPPPUTV3PPPRVVUP.........',
      '.........P..PPU3R8P.P8R3RP.........',
      '.............PPPPP...PPPPP.........',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...........P..........PP...........',
      '..........dcP..PPPP...drP..........',
      '..........dcP.PPSRUP.8RcP..........',
      '.........SfcP8SURTV3UPUcdP.........',
      '.........dccdSR33R6g9URcfP.xn......',
      '.........dccLPUVTR6mgVRcfW.nyx.....',
      '.........SfcLPUV6T9hmVRd8...x......',
      '.........8RccPSRTRVhh6TP...........',
      '..........8ed8SPZlUmmB3P...........',
      '..........PP8R3SlNPPXuZP...........',
      '...........PSRT9TRRPRVW....PPPP....',
      '..........P44S39gh6PURP...PP8PP....',
      '.........P4bQ7PPVgTP6i3P.P8SPP.....',
      '........PZYbQo0Q747Smg9PP8S8P......',
      '.......XXbYZZoQQQQQX39TP8SPP.......',
      '.......X5QbZ8Z44QQQ0ZSSU8PP........',
      '......XbQ51XUTUUXXXXPSdrSP.........',
      '.....XYQQ14UtA8T99V99UemVP.........',
      '.....4QQ514RcL8UVVVVTSR63P.........',
      '.....4Q5114U6gU3RUUUTRS38..........',
      '.....45ZP44P8UVVU88STVUPP..........',
      '.....PX..XPPUT9T8PP8RVVRP..........',
      '...........PU33SP..PP3TRP..........',
      '...........PPPPP....PPPPP..........',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.......8R8..........US.............',
      '.......PcS..PPPP...Pfe.............',
      '......PdLU.PPSUUS8.PerU..xn........',
      '......PcLUPSUR3VVT8PecdPxyyx.......',
      '......WtLeUU33RT6gT8fcd..nn........',
      '......PccLdSTVTTgi9RetS............',
      '......88tcdSTV6TghiVUP8..n.........',
      '.......PttdSURTRgwm9UP...n.........',
      '....nx.8PPPU88ll3mHlSP.............',
      '...xzy..88U33RllPP1lP....PPP.......',
      '....nx..XPSUT63VUPTTP...PP8P.......',
      '........P4Y1UTihTPhiPPPP88PP.......',
      '.......X1447bbR3SP3abPP88PP........',
      '......X71Srf7Q5555555P88PP.........',
      '.....XYYXfcA97QQQQQ5XPPPP..........',
      '....PbQ5Pfi6TPbb55YP8tdP...........',
      '...PbQ0YXU9VSRRSSSUR8AmU...........',
      '..P7QQb11XPPUT9999938igS...........',
      '..P7Q511Y1XSURTVVVTS8VV8...........',
      '..P7b41YY1PU3TRRUU3T8S8P...........',
      '..PPXPX1YXPRVVU88STVRP.............',
      '......PXXPUTVR8PPP3VTS.............',
      '........PPU338P..P833UP............',
      '.........PPPPP....PPPPP............',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.......P..........PP...............',
      '......dfP..PPPP...dfP..............',
      '......drP.8PSUU8PPRcS..xx..........',
      '.....SfcPPSURV9TUPScd..xyx.........',
      '.....dcce8U33T6g93Pcd...x..........',
      '.....dcLcPUVV39mg9PcR..............',
      '.....SfccPUV6TVhh93PP.....PPP......',
      '......UttPURTRThw6V8.....P8PP......',
      '......PPPPU8ZlagmBlP....PSSPP......',
      '.......P8UTUlNaPPl1P...P8SPP.......',
      '........PU39TR3PSTRPP.P888P........',
      '.......X4XU96hiP3hVPPP8S8P.........',
      '......X1o5XP3gVP8TT6RPS8P..........',
      '.....PZYQQ0Q547b50ggVP8P...........',
      '.....XbY47QQQQQQQo4RSSP............',
      '....X0o78aZZbQQo5Z8PfceP...........',
      '...XbQ5XU9ePUXP883TPfmiP...........',
      '...7QoYPtLcPT9999VV8T6VP...........',
      '...7QbYPfAgPUTVVVVR88USP...........',
      '...4741PR9T83RUUURT38XZP...........',
      '...PXP1ZPP8TVU888UVVSZZZP..........',
      '.....PXPPUTV38PPPU3V38PXP..........',
      '........PU338P...PU338P.P..........',
      '........PPPPP....PPPPP.............',
      '...................................',
    ],
  ],
  [
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '..............S8...................',
      '.............Prd...................',
      '.............PLd..PPPPP............',
      '........PP..PtLdPP8U3TUP..SP.......',
      '.......PPPP.8cLe8UURTVTPPPcUP......',
      '.......P88PP8cLLSU333V6VPPceP......',
      '........P888PUccSUTVRVi63PceP......',
      '.........P8S88tc8RT6T9hiTRcdP......',
      '..........P88PP8P8PSS9wmVRSP.......',
      '........XXXP8PSR33PNlVhmVS8........',
      '......PX5QQ78PZUT9T1aSTBl8.........',
      '......ZQQQ5Y4PQ4R9gmVP8ZZP.........',
      '.....PQQQ514XPQQ7PghgP6m8P........P',
      '....P5QQ5YYXPPXQQQZaRP9gPP........4',
      '...PYQQbYYZUtcUX0Qo5bb774XP......P0',
      '...P0Qb4YYZdcAe8PXQQQQ57SUPP.....P5',
      '...P5bPX1YZdri3SRSX447ZPfcdP.....P5',
      '...PYX..X4Z8VT8URTTTTUPPriTP.....PX',
      '....P...PPPPPPUTTR33TT3PV9RP.......',
      '...........PSRTT3S88STV38SP........',
      '...........P3TTU8P.PPUVVRP.........',
      '...........PP88P....PPS8PPP........',
      '...................................',
      '...................................',
      '...................PPP.............',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...........P.........96gig.........',
      '..........ScW..........6mwmi.......',
      '.........PdcP..PPPP.....6h2Kmi.....',
      '.........UtcPPPURVTP..dR.iK22hi....',
      '.........dccUSRRRVV3PPfe8.i222h....',
      '........PdcLcPUT33963PfdP.ik222i...',
      '.........8dccPRVV3gm6Srd8..m222Ki..',
      '.......PPPdctPUT6R6wgRdP...i222ki..',
      '.....PP7bYP88P8PPSgwgT8....i2222h..',
      '..PXXboQQQZSR33PGlVhiRP....i2222wi.',
      '.X4QQQ0550QZUTVV8XPPuZ.....h2222wi.',
      'Z5QQob4XXX0QZaV6h6P3TP....ik2222wi.',
      'oQQQ1Z1YYP8QQbPThg8igP..8.i22222hi.',
      'QQoYYYYYZPPX5Qo5P8PRSPPP8Vh2222ki..',
      'QoY1Y114PfLrPZ5QQQ054P883m22222Ki..',
      'Q71Y11Y4PcJgT8PZ0554P88Uik22222m...',
      'ZPX1111ZPtrV66SPP88P8PUik22222wi...',
      'X.PX44ZPf8STVVSPUUTTTRPa22222ki....',
      '...PPPPPSUUSU8SS8SSU3R3UPPw2km.....',
      '......P8RTTRS8S8PP888SR333S9i......',
      '.....P8RT3UP.....PP88PPPSUUP3......',
      '.....PPP8PP.......PPPP..PPP........',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...........PP......................',
      '..........8erP.....................',
      '..........PfrP.PPPPP...............',
      '.........PdcrPP8U3TUP.PR...........',
      '.........8fcrUSRU3VVSPSc8..........',
      '.........PfcLf8R3RV9V8Scd..........',
      '..........Pfcf83TTTggVScd..........',
      '.........PPetf8RV9Tmh9UfS..........',
      '.......X44ZP8P8P8S3mh93P......PPPP.',
      '.....Z47QQ0ZURTSluShh6SP.....PPU8P.',
      '...XZ0QQQQQQZUT9T1PSlNP....PPU3UPP.',
      '..PbQQQ5ZXYQQXaViiU83SP..PPS3RSPP..',
      '.PbQQQ1Z44PXQQbXVmUUhTP8P8R3U8P....',
      'S40QQY1111PPX7QQ7XP83SPP8UUSPP.....',
      'P5Qob11114SrceZ0QQQQ5X3U8SPPP......',
      'P0Q741111ZUcA6TSb55YXSig8PP........',
      'P54PX111XP8ffV66U88SS8968P.........',
      'PXX.PZ4X.PP8U3VTS3VVUPRUP..........',
      '.....PX..PUR3US8S33VTSPP...........',
      '........PP3TTRU88SUTV3P............',
      '.......P83T3SPP..PPRVVSP...........',
      '.......PPP8PP.....P8S8PP...........',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...........PP.........99gg.........',
      '..........PefP..........gwhi.......',
      '..........PffP.PPPPW.....iK2hm.....',
      '.........PecfPP8URTUP.8R..mk2Ki....',
      '.........PfcrSUUU3VVU8UcP.gK22w....',
      '.........PfcLf8RTRT998StP..i22ki...',
      '.........PPfcf83VTVigTUtW..i222wi..',
      '..........Petf8R99TmhVRe8..i222Ki..',
      '........PPWPP8SP8SThh9R8...h222Ki..',
      '.......P7ooXSRTSlN8hhVP...ik222Ki..',
      '.....XX0QQQoXRT9RZPPluP...m2222h...',
      '...PZ0QQQQQQQXSVimU8T8S..iK2222i...',
      '..PYQQQQQbZZQobP9mSRm3S.iw2222ki...',
      '..4oQQQ5ZX8UX7ZWXPPPRP8gh22222h....',
      '.Z5QQ01X48UTVVrARX505S6w22222Ki....',
      'PbQQ5X411PUTTeLA6TaPPTm22222ki.....',
      'PYo4PZ11ZPURRRt996TSRUaiMw2ki......',
      'PZ4..PZZ8UU3TUSTVTSSR3RUU3ii.......',
      '.PP..PPPS3T3RUU888P8SSUR3RU8.......',
      '......PSRTTR8P8S3TRPPP8SUUUSP......',
      '.....PS3TRSPPPPPUVV8P.PPPPPPP......',
      '.....PP88PP....PP88P...............',
      '...................................',
      '...................................',
      '...................................',
    ],
  ],
  [
    [
      '..................PP8P.............',
      '.................P8S8P.............',
      '................P8SSP..............',
      '...............P8SSP...............',
      '..............PPS8PP...............',
      '.............PPSSP.................',
      '............PR88PP..........P......',
      '...........PT9TPfP..PPWP...PeP.....',
      '..........P8V9TPcP.P8SUUP..PcS.....',
      '..........PUTTSSL8P8URVVRUPPcdP....',
      '..........PPU33Sce8U33T96VUPcdP....',
      '...........PSVV8rLPUVTR6igVPcdP....',
      '............SV9UetPRT6TVhmVUd8.....',
      '............8T9Rde8SS3UThh9TP......',
      '............PUVVPSURPllRhh6RP......',
      '............PST98S3VV1Y8P1uW.......',
      '............XZSV8bSV69gUPTTP.......',
      '...........ZbY8RPobSRihT8miPP......',
      '..........Xb0bZ8P5Qbb3TSPTa4X......',
      '.........Z5Q5Y1X84oQQ555555bXP.....',
      '........45Q0bY1XU3Z7bQQQQ078S8.....',
      '.......Z5QobYY18TePUR7777XPeAiS....',
      '......Z5Q0b11Y4dccPT933333PfmiU....',
      '......ZQ0741Y1ZdcrP3V999VRPTg9S....',
      '......Z07PP4Y1XST3URUUUURR8S3RP....',
      '......PZ...XZZP8U3TRSSSS3V3PPP.....',
      '............PP8RTVT8PPPPRVVRP......',
      '.............PS3TTSP...P83TTPP.....',
      '.............PPPPPP.....PPPPPP.....',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '..........................iK.......',
      '...........................mk......',
      '...........................iwk.....',
      '.............P..............m2k....',
      '.............dS.............mK2K...',
      '............Prd..PPPP....P...h2ki..',
      '............8ce8P8SRUP..SeU..ik2h..',
      '...........PtLePSURVV3SP8cS..iK2Ki.',
      '...........PtLfUURR3V9T88cS...h2km.',
      '...........PfcLeUTTR9g63Sc8...m22wm',
      '...........PPtceUT9T6hiVUe8...mk2km',
      '...........PPefdPUTRVhm9RPP...mk2Km',
      '...........PPP8SUPlZVhm9U8....mk2Ki',
      '..........ZYYPS3TaulUgHl8.....mk2km',
      '.........Z5QQbZUVVVUPPl1P.....mk2km',
      '.......PZ5QQQQ5bR6hi83iU......m22Ki',
      '......P75QQb440oYTg9P6hU.....mK22m.',
      '.....P7oQQY14PXPZ54ZXXPP.....hk2yI.',
      '....P7QQob11ZUeLra4QQQ5PP...mk2yzn.',
      '....Z0Q0bY11XSrLiVTX478UUP.iK22Cy..',
      '....4QQ51111P8ecV9gVPUSSSamk222kI..',
      '....7Qb4111Z8USdTVV3833UP3K22CCh...',
      '....45ZPX14PU33U8SS8SSU3TUPhzzzM...',
      '....PX..PXXSRVVR8SSSU88SR3R3zzn....',
      '.........PP3VV38PPP83TU88SUROn.....',
      '.........PU3T3PP...P8338PPSSDMP....',
      '.........PPPPPP.....PPPP..PPPWP....',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.............P.....................',
      '............dR.....................',
      '...........8feP.PPPP...............',
      '...........PcePPPSU8...............',
      '..........PfLdPSRRV38..Ud..........',
      '..........ScLfURRRVV3PPefP.........',
      '..........StcLSU3RT9VRPftW.........',
      '..........PdtcPRVTT6gV8ffP.........',
      '..........8Rff8RV9Tim6SteP.........',
      '.........PPP8PP8RTTmh9TPP..........',
      '........XZYXSR3S1l3hh63P...........',
      '........X5o18UVVlu8mm6SP.......n...',
      '.......X5Qo71XT6VUPPllP....nx.nzn..',
      '.....PZ5Q0bX55Y3hiP398P...yzx..n...',
      '....P70QQb48PX5YTTPVg8eP.nyn.......',
      '...PboQQ5YXecrX7bY77PScd.nn........',
      '..XbQQQbY1PfLATXbQQbX3TS.....nn....',
      '.PZ0QQ51YYXdc66TP77STV3X.nyn.nn....',
      '.P5Q05bYY1P8RT6gUPUVg6RDyzyn.......',
      '.P5571nF7PUDDUVVUSRgigDz2zn........',
      '.WY4WZnCnZ3FzFP8RRPgmIz2Cn...nx....',
      '.PPP.PanCn3RIIZPSUUSgy2Cna...x.....',
      '.....PP.zCDPPPFPPPPPDyCyXPPP..PP...',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...........PPPP....................',
      '..........PP8PP....................',
      '.........P88PP.....................',
      '........PP88P......................',
      '.......PP8PP.......................',
      '.....PPP8ddP.PPPPP...SS............',
      '....PSVTPfrPPPUTT3PPPfeP...........',
      '....PT69PtrPUUR3VVT8PfcW...........',
      '....PRT3PtcfPRT3T96TPecP...........',
      '....PPRTRdcrPRVTTii6UfcP...........',
      '.....PT9T8tf83V9TmwgTddP...........',
      '.....PUV6URd8P88Uihg9U8............',
      '......PT6VPU33XN1gmH9S8............',
      '......WUV9PS3VT1XP8llP......nn.....',
      '.......PS3ZbPV6i9PSVRP......nx.....',
      '......WZZS4QbUVhm8ThTP.............',
      '......Z51XX5Q5bUUPS347P............',
      '.....Z00YZSZbQQ5555551P...n........',
      '....XbQ51XUTZ7bQQQQb48PP.nzy.......',
      '....4Q0Y4UcA8Ua1Y77XPrA3P.nn.......',
      '....4Q514UcAPTTRRRRU8AiVP..........',
      '....ZbX44Sf9SUTTTT3UPV6TP..........',
      '....XZ.XZPSUVRSSSUTVSU3SP..........',
      '.....P.PPSTVTSPPP83VTUP............',
      '........PRTTUP...PSTT3PP...........',
      '........PPPPP.....PPPPPP...........',
      '...................................',
    ],
  ],
  [
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.................8P................',
      '................PreP.PPPPP.........',
      '................Pce8PPSRRSP........',
      '.........PPP...PfLeP8UR3VTRP.......',
      '.........PPPP..PtLfRUR3RTV9UP......',
      '.........P88P..PtcLr8RVT3Vg3P......',
      '..........PSSP.PdtcrPRT6TTh6P......',
      '...........PS8PPPttfP8R3UTmgP......',
      '...........PP8PPPddU88PulRHgP......',
      '............P8PZ4ZPU33Sl1Pl1.......',
      '............PX7QQ57S39VVTPP........',
      '...........P4YQQQQQ7439hiP.........',
      '........PPXbQQQ5bbQQ57RTRP.........',
      '.......P4b5QQob4XP4bQQ5bZP.........',
      '.......4oQQQ0b11XUSP4QQ5X..........',
      '......ZbQQQ0bYY4SeAAS4ZZP..........',
      '......ZQQQ5Y1Y1X8fLr6P3U8P.........',
      '......ZQQ5Y1114PSer6VPVTRP.........',
      '......X554P4Y1XSUP3T8U3VVP.........',
      '.......4bP.PZXPU338PPPUTVTPPP......',
      '.......PP...PPS3TR8P..PUTVTSP......',
      '.............PPURP.....PUR8P.......',
      '..............PPPP......PP.........',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '..................PPP..............',
      '..................RcPPPPP..........',
      '.................PecWP8PS8.........',
      '..........PP....PdrLP8URTRSP.......',
      '..........PPP..PPecLSUURTVVUP......',
      '..........P8PP.PPecLL8U33T69P......',
      '..........PP8PPPPdtcL8RTV36mP......',
      '...........P8SPPPPfcc8U39RgwP......',
      '............P88PPPddePPXXP6wW......',
      '............PPX44ZPSRRR1GlaGP......',
      '............PZ7QQb4S3T9UP8PP.......',
      '..........X77QQQQQQ4a3VihVP........',
      '.......PP4bQQQ0bYQQQb7a6iRP........',
      '......P75oQQQ5YXP44oQQ74XP.........',
      '.....P5oQQQobYZ8ffP45QQ5XPP........',
      '.....P5QQQ0b11XfLATP1bb4RTSP.......',
      '.....PZoQQb1Y4PfAgV83UUSVVRP.......',
      '......PYQbXXXZPP9VSUVVRP3T8P.......',
      '.......X5Z..PPSSP8S3TVRPWPP........',
      '.......PZP...8RT3U8SRVT8P..........',
      '........P...PUTTUPPPUTV38..........',
      '............PSRUP..PPURRPP.........',
      '............PPPP....PPPPP..........',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.................P8P...............',
      '...............PP8cdPP.............',
      '..............PPSRLd8SS8P..........',
      '.............PSSSfLd8RTV38.........',
      '............PSUS8cLeSR3V9SP........',
      '.......PPP..PSUSSccLfS3Vi3P........',
      '.......P8PP.PSUS8fcLf83ViVP........',
      '.......P88PPPPUUSUcce8URi9P........',
      '........P8SPPPSS88dRS81lBlP........',
      '.........P8SPX744X8SRRa1PX.........',
      '..........P8ZbQQQb74UTVTP..........',
      '..........WZY5QQ0QQQ7UggP..........',
      '.........P75bYbbYQQQo7P8P..........',
      '.......PPboQbYYY0QbXXSdP...........',
      '.......Z5QQ5YYY0Q0XUUcJ6P..........',
      '......ZbQQobYY5QQ5PUUJAgTP.........',
      '......4QQ05YYbQQQ7PSSci9VP.........',
      '......ZQ05YYboQQQPSRSPTTRP.........',
      '......XXPZYYboQQQPU3TSPPP..........',
      '......P..PXXPPbQQP8UTV3P...........',
      '............PSX74PP83VTS...........',
      '...........PPSPPP..PS33SP..........',
      '............PPPP....PPPPP..........',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '...................................',
      '.............PPP...................',
      '..........PPPPffP..................',
      '........PPUU8PrrPP.................',
      '.......PRTT3UPrcfPP................',
      '......PU9V3RUUrctPP...PP...........',
      '......PTgTT3PcLctPP..PPP...........',
      '......PgiVVTPcctePP.P88P...........',
      '......PgiTTRPtctPSPPP8PP...........',
      '......Pgg1ZP8dddP8PP8PP............',
      '.......l1l1S3USPX44XPP.............',
      '........PR39VR84bQQYXP.............',
      '........Sgm9R47QQQQQb4ZP...........',
      '........P3TR7QQQ5bb0QQ57PPPPP......',
      '.........P45Q5b4XPX4bQQQbbbb4P.....',
      '.........P4Q7WSRRUP11bbQQQQQbP.....',
      '.........PPXRArVTRP11YYbboQo1P.....',
      '.........P8SgALeUSPXY111ZZYbX......',
      '........PSR89icdSRUP111ZP.XX.......',
      '........PRTURTU8RTR8XZZP...........',
      '......PPUVTUPPP8RT3UPPP............',
      '......PUTVR8P..PSRTUP..............',
      '.......PSRPP....P8USP..............',
      '.......PPPP......PPP...............',
      '...................................',
      '...................................',
      '...................................',
    ],
  ],
  [
    [
      '...................................',
      '...................................',
      '...................................',
      '..............dP........Pd.........',
      '.............PcP..PPPP..WcW........',
      '............PdLPPPUUT3PPPceP.......',
      '............PtLPPURTVVT8PcrP.......',
      '......pp....PtceSUTT9V9RdctP.......',
      '.....jqkj...PetfSUTT9993dtdP..p....',
      '.....s22qp...8dUSR3TV9VUUd8...jj...',
      '.....jk2sp....P8SURRR3US8P.........',
      '......jjp.....PXZZSSUSZ4ZP.........',
      '.............PP5QbZZZZoQbPP......p.',
      '.............P4YQQQQQQQoYXSSP...jsp',
      '............8PYYYbQQQQbYYP96U8..jsp',
      '.........PSU8PYYbY5055YYbP66R8..pp.',
      '........PR6fdXYYQbYYYYY55P33P......',
      '........PRgfeZbYQ0bYYYbQQZPP8......',
      '.........8VeU45YQQ5YYY0QQQZP.......',
      '.........PPPXb5YQQQoYYYQQQQbWW.....',
      '............Z5Y1QQQQQYY5QQQQoYP....',
      '............Z54PoQQQQYYYoQ550bP....',
      '............X4PUP5QQ5PZ1YbPWX7P....',
      '............PPPRRPXXPUUPPP...PP....',
      '.............P8UU8P.PPUU8P.........',
      '..............PPPP...PPPPP.........',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '.........................vp........',
      '.........................pEp.......',
      '..........RU.........Sd..jqp.......',
      '.........PefP.PPPPP.8eeW.ppp.......',
      '.........RffPP8UR3UPPerR....jj.....',
      '........PecfP8R3TVVUPeLeP...jEj....',
      '........8dccSURTV99TPtcdP...pkkj...',
      '......pp8UfcRUUTV99VPttUP....s2qj..',
      '.....jsp.8RdSURTTV93PddP.....s22j..',
      '...jsqj...8P8UURRRRUSP8.......kkj..',
      '...j2qj....PZ48SSUPZZP........kEj..',
      '...j2ks...PZ5Q7ZZZ7QQZP..PPPP.qj...',
      '...jE2E...PYb0QQQQQQ51PP839V8.j....',
      '....jq2s.XZYY10QQQQYY7PRT99TP......',
      '.....jEkqjBYlll500bY5bP3VVTP.......',
      '......lsE2kEEEvYYYYbQ5PUUSP........',
      '.....8ZYjjsqqjlbYYY0Q0XPPP.........',
      '....P7QQQ0lBB5QQ5YY5QQbP....pj.....',
      '...P5QQo5YYYoQQQQYoYQQ5Z....jj.....',
      '...PQbY7YYYoQQQQQQQYbQQ5X..........',
      '...P4PPPZ15Q0PPZoQQY85504..........',
      '...PP...PX55PUUPXQoPUPP4Z..........',
      '.........PPPR3RPPPPR3SPXP..........',
      '..........P8UUP..P8UUSP............',
      '..........PPPPP...PPPPP............',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...........vjp.....................',
      '...........pqEp....................',
      '...........vjjp....................',
      '...........dvv.......Pd............',
      '.......ps.8fd..PPPP..PcP...p.......',
      '......jq..dcdPPSRT38PPceP.vsjp.....',
      '.....pqh.8fLdPURTV9T8PccP...qsp....',
      '.....pq..8fcf8R3V9993dct8..pjqs....',
      '.....pp..Pdtt8R3TV993dcfP..jjjE....',
      '..........Pdd8RRTV9VUSdS..vsEp.....',
      '..ppp......PPSUURRRRU8P....pp......',
      '..pEpp.....8XZZSUUSX4ZP....a...pp..',
      '.ps2sp.....P10QZZZZ5Q5P8..PUP..jj..',
      '..pspv.P..8ZY0QQQQQQQb7PPST938.p...',
      '...p..83U8PXYYYQQQQ5YYYPUVVVUP.....',
      '.....8TgVRSZbbYbbbbYY5bPUTRSP......',
      '.....8T9VdUYQoYYYYYYY5QYPSP....qp..',
      '...p..ST3abQQ0YYYb55Y5QQ4P....kj...',
      '...js.R8ZbQQoYYYb5Q5YYQQo4X..qsp...',
      '...pqslZ5QQoYYYYQQQY11bQQQYXvp.....',
      '....jqEBuQ5YYYY0QQoYP8Z050o7X......',
      '.....jqkqBl1YY5QQQbPUUX4P40bP......',
      '......ljsEj8X1QQQb8RTR8P..ZbP......',
      '.......ljplPSPZPPPPRV38P..PPP......',
      '...........PSUSP..PURUP............',
      '...........PPPP....PPPP............',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
    ],
    [
      '...................................',
      '...................................',
      '...................................',
      '.........RS........PdU.............',
      '....p...Pfe..PPPPP.PrR.............',
      '..pjjp.8RrePPUUTTSPPrt8.....p......',
      '..pEqp.8ecePURTV9TSPrc8.....sp.....',
      '..pppp.8ecrPRRT9993dcc8............',
      '.......8RttPR3T9993dcf8............',
      '........8ddPU3TV9VUSdS...jjj.......',
      '...pjp...8P8URRRRRS8P...jk2qj......',
      '..jqj....8X4ZSSUSZ4Z8..ps222j......',
      '.sks...8PP1Q0ZZZZ0QbP...s222j......',
      'jE2j..PUSP10QQQQQQoYZP..jqqsj......',
      'jq2q.SU6981YbQQQQbYYZP...ppj.......',
      '.jkk.aR66PYbYb55bYYQ7X.............',
      '..skq.PR3Pb0bYYYYYYQQ7P............',
      '...jp..PPZ0Q5YYYYbY0QQ4ZP...p......',
      '.......PX5QQ5YYYYQ5YQQQo4X.pj......',
      '.......XbQQQbYYYYQQYY0QQQ5X........',
      '......XYQQQ51YYYYQQ0YY555QX........',
      '.....XbQQQQbZYYYYQQQY4XWP7P........',
      '.....ZQ7455XaYYYYbQQXP...PP........',
      '.....XZPPPPUaZPPPYYZP..............',
      '.....P...PSS8P.PPSUSP..............',
      '.........PPPP...PPPPP..............',
      '...................................',
      '...................................',
      '...................................',
      '...................................',
    ],
  ],
]

type Mood = (typeof MOOD_ORDER)[number]

const moodOf = (isBusy: boolean, name: string): Mood => {
  if (!isBusy) return 'idle'
  if (/^(Edit|Write|NotebookEdit|MultiEdit)$/.test(name)) return 'forge'
  if (/^(Read|Grep|Glob|WebSearch|WebFetch|LS)$/.test(name)) return 'search'
  if (name === 'Bash') return 'spell'
  if (name) return 'fight'
  return 'think'
}

// Frames to play per mood. The sheet draws the sword in a different hand in
// some frames (idle 3, fight 1, forge 1 and 4, search 3), so those are skipped.
const SEQUENCE: Record<Mood, number[]> = {
  idle: [0, 1, 3],
  think: [0, 1, 2, 3],
  fight: [1, 2, 3],
  forge: [1, 2],
  search: [0, 1, 3],
  spell: [0, 1, 2, 3],
}

const sprite = (mood: Mood, f: number): string[][] => {
  // the calm moods play at half speed
  const seq = SEQUENCE[mood]
  const step = Math.floor(mood === 'idle' || mood === 'think' ? f / 2 : f)
  const row = FRAMES[MOOD_ORDER.indexOf(mood)] ?? []
  const lines = row[seq[step % seq.length] ?? 0] ?? []
  return lines.map(r => r.split(''))
}

const MOODS: Record<Mood, [string, string, string]> = {
  idle: ['LIVRE', 'esperando seu comando', '#4caf50'],
  think: ['PENSANDO', 'planejando a estratégia...', '#f2b705'],
  fight: ['LUTANDO', 'em batalha...', '#f2b705'],
  forge: ['FORJANDO', 'martelando o código...', '#ff8a3d'],
  search: ['EXPLORANDO', 'vasculhando o reino...', '#4fc3f7'],
  spell: ['CONJURANDO', 'lançando um feitiço...', '#b36bff'],
}

// --- HP / MP bars: text blocks with a sweeping shine and a pulsing edge ---
const BAR_CELLS = 20
const TRACK = '#3a3a3a'
const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']

const mix = (a: string, b: string, t: number) => {
  const c = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16)
  const ch = (i: number) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * t).toString(16).padStart(2, '0')
  return `#${ch(1)}${ch(3)}${ch(5)}`
}

// --- agent task bars: real progress from a todo list, else an estimate ---
const DONE_SHOW_MS = 8000
const MAX_TASKS = 6
const STOPS: [number, string][] = [[0, '#e5484d'], [35, '#f08a24'], [65, '#f2c94c'], [100, '#46c06a']]

type Todo = { content: string; status: 'pending' | 'in_progress' | 'completed'; activeForm: string }

// a bar that has made `calls` tool calls and has no checklist: creeps toward 90%
const guess = (calls: number) => Math.min(90, Math.round(90 * (1 - Math.exp(-calls / 10))))

const colorAt = (pct: number) => {
  for (let i = 1; i < STOPS.length; i++) {
    const [p0, c0] = STOPS[i - 1] ?? [0, '#e5484d']
    const [p1, c1] = STOPS[i] ?? [100, '#46c06a']
    if (pct <= p1) return mix(c0, c1, (pct - p0) / (p1 - p0))
  }
  return '#46c06a'
}

const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n - 1)}…` : text)

const upsert = (list: Task[], id: string, make: () => Task, change: (t: Task) => Task) =>
  list.some(t => t.id === id) ? list.map(t => (t.id === id ? change(t) : t)) : [...list, change(make())]

const fmt = (n: number) => n.toLocaleString('pt-BR')

const reset = (at: string | undefined, now: number) => {
  if (!at) return ''
  const ms = Date.parse(at) - now
  if (!(ms > 0)) return 'recarrega agora'
  const m = Math.floor(ms / 60000)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  if (d > 0) return `recarrega em ${d}d${h}h`
  return `recarrega em ${h}h${String(m % 60).padStart(2, '0')}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'knight', description: 'Abre o painel do cavaleiro' })
    void $.ui.open({ id: PANE, title: 'Cavaleiro' })
    $.clock.every(350, () => update($, frame, n => n + 1))
    return next(e)
  })

  on('command.run', { command: 'knight' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Cavaleiro' })
    return { text: 'Painel do cavaleiro aberto.' }
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId ?? 'main'
    const todos = (e as { todos?: Todo[] }).todos
    if (e.tool === 'TodoWrite' && todos && todos.length > 0) {
      const done = todos.filter(t => t.status === 'completed').length
      const now = todos.find(t => t.status === 'in_progress')
      await update($, tasks, list =>
        list.map(t =>
          t.id === id && !t.isDone
            ? { ...t, pct: Math.round((done / todos.length) * 100), isReal: true, title: now?.activeForm ?? t.title }
            : t,
        ),
      )
    } else if (e.tool !== 'Agent') {
      await update($, tasks, list =>
        list.map(t =>
          t.id === id && !t.isDone
            ? { ...t, calls: t.calls + 1, pct: t.isReal ? t.pct : guess(t.calls + 1) }
            : t,
        ),
      )
    }
    if (e.agentId) return next(e)
    await update($, tool, () => e.tool)
    const ran = await next(e)
    await update($, tool, () => '')
    return ran
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.agentId && !e.workflow) {
      const id = started.agentId
      const title = e.description || e.subagentType
      await update($, tasks, list =>
        upsert(list, id, () => ({ id, title, kind: 'sub', agentType: e.subagentType, pct: 0, isReal: false, calls: 0, isDone: false }), t => t),
      )
    }
    return started
  })

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      await update($, busy, () => true)
      const now = await $.clock.now()
      const title = clip(e.text.replace(/\s+/g, ' ').trim() || 'Agente principal', 40)
      await update($, tasks, list => [
        { id: 'main', title, kind: 'main', pct: 0, isReal: false, calls: 0, isDone: false } as Task,
        ...list.filter(t => t.id !== 'main' && (!t.isDone || now - (t.endedAt ?? now) < DONE_SHOW_MS)),
      ])
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const now = await $.clock.now()
    const id = e.agentId ?? 'main'
    await update($, tasks, list =>
      list.map(t => (t.id === id && !t.isDone ? { ...t, pct: 100, isDone: true, endedAt: now } : t)),
    )
    if (!e.agentId) {
      await update($, busy, () => false)
      await update($, tool, () => '')
      const u = e.usage
      await update($, totals, t => ({
        input: t.input + (u?.input_tokens ?? 0),
        output: t.output + (u?.output_tokens ?? 0),
        cache: t.cache + (u?.cache_read_input_tokens ?? 0),
        missions: t.missions + 1,
      }))
    }
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => e.rateLimits.map(l => ({ ...l })))
    await update($, usd, () => e.cost?.usd ?? 0)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const isBusy = await read($, busy)
    const lim = await read($, limits)
    const cost = await read($, usd)
    const t = await read($, totals)
    const now = await $.clock.now()
    const f = await read($, frame)
    const name = await read($, tool)
    const mood = moodOf(isBusy, name)
    const [label, caption, tint] = MOODS[mood]
    const px = sprite(mood, f)

    // two pixel rows per terminal row: upper half block, fg = top, bg = bottom
    const paint = (grid: string[][]) => {
      const rows = []
      for (let y = 0; y < grid.length; y += 2) {
        const cells = []
        for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
          const top = PALETTE[grid[y]?.[x] ?? '.']
          const bottom = PALETTE[grid[y + 1]?.[x] ?? '.']
          if (!top && !bottom) cells.push(<Text>{' '}</Text>)
          else if (top && bottom) cells.push(<Text color={top} backgroundColor={bottom}>{'▀'}</Text>)
          else if (top) cells.push(<Text color={top}>{'▀'}</Text>)
          else cells.push(<Text color={bottom}>{'▄'}</Text>)
        }
        rows.push(<Box flexDirection="row">{cells}</Box>)
      }
      return <Box flexDirection="column">{rows}</Box>
    }

    const bar = (label: string, percent: number | undefined, resetAt: string | undefined, base: string, glow: string) => {
      const left = percent === undefined ? 100 : Math.max(0, Math.min(100, Math.round(100 - percent)))
      const exact = left / 100 * BAR_CELLS
      const whole = Math.floor(exact)
      const part = EIGHTHS[Math.round((exact - whole) * 8) % 8]
      const low = left <= 20
      const pulse = (Math.sin(f / 1.5) + 1) / 2
      const cells = []
      for (let i = 0; i < whole; i++) {
        // a bright wave runs along the fill, trailing off behind it
        const dist = ((f % (BAR_CELLS + 8)) - 3 - i + BAR_CELLS + 8) % (BAR_CELLS + 8)
        const wave = dist < 4 ? 1 - dist / 4 : 0
        const edge = i === whole - 1 ? pulse * 0.5 : 0
        const alarm = low ? pulse * 0.6 : 0
        cells.push(<Text color={mix(base, low ? '#ffffff' : glow, Math.min(1, wave * 0.8 + edge + alarm))}>{'█'}</Text>)
      }
      if (part) cells.push(<Text color={mix(base, glow, pulse * 0.5)} backgroundColor={TRACK}>{part}</Text>)
      const rest = BAR_CELLS - whole - (part ? 1 : 0)
      return (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            <Text bold color={base}>{label} </Text>
            {cells}
            <Text color={TRACK}>{'█'.repeat(Math.max(0, rest))}</Text>
            <Text bold color={low ? mix(base, '#ffffff', pulse) : undefined}> {left}%</Text>
          </Text>
          <Text dimColor>{resetAt ? reset(resetAt, now) : 'sem leitura'}</Text>
        </Box>
      )
    }
    const all = await read($, tasks)
    const shown = all
      .filter(t => !t.isDone || now - (t.endedAt ?? now) < DONE_SHOW_MS)
      .sort((a, b) => Number(a.isDone) - Number(b.isDone))
      .slice(0, MAX_TASKS)
    const TASK_CELLS = 22
    const taskRow = (t: Task) => {
      const exact = (t.pct / 100) * TASK_CELLS
      const whole = Math.floor(exact)
      const part = EIGHTHS[Math.round((exact - whole) * 8) % 8]
      const col = colorAt(t.pct)
      const cells = []
      for (let i = 0; i < whole; i++) {
        const dist = ((f % (TASK_CELLS + 6)) - 2 - i + TASK_CELLS + 6) % (TASK_CELLS + 6)
        const wave = !t.isDone && dist < 3 ? 0.5 * (1 - dist / 3) : 0
        cells.push(<Text color={mix(col, '#ffffff', wave)}>{'█'}</Text>)
      }
      if (part) cells.push(<Text color={col} backgroundColor={TRACK}>{part}</Text>)
      const rest = TASK_CELLS - whole - (part ? 1 : 0)
      return (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            <Text color={col} bold>{t.isDone ? '✓' : t.kind === 'main' ? '◆' : '↳'} </Text>
            <Text bold>{clip(t.title, 30)}</Text>
            {t.agentType && <Text dimColor> · {clip(t.agentType, 14)}</Text>}
          </Text>
          <Text>
            {cells}
            <Text color={TRACK}>{'█'.repeat(Math.max(0, rest))}</Text>
            <Text bold color={col}> {t.isReal || t.isDone || t.pct === 0 ? '' : '~'}{t.pct}%</Text>
          </Text>
        </Box>
      )
    }
    const five = lim.find(l => l.kind === 'five_hour')
    const seven = lim.find(l => l.kind === 'seven_day')

    return (
      <Box flexDirection="column" alignItems="center" paddingY={1}>
        {paint(px)}
        <Box marginTop={1}>
          <Text bold color={tint}>● {label}</Text>
        </Box>
        <Text dimColor>{caption}</Text>
        <Box flexDirection="column" marginTop={1}>
          {bar('HP', five?.percentUsed, five?.resetsAt, '#d62839', '#ff8fa0')}
          {bar('MP', seven?.percentUsed, seven?.resetsAt, '#3a8fd6', '#9bd3ff')}
          {shown.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>TAREFAS</Text>
              {shown.map(taskRow)}
            </Box>
          )}
          <Box flexDirection="column" marginTop={1}>
            <Text><Text bold>XP </Text><Text color="#8a6fdf">{fmt(t.input + t.output)} tokens</Text></Text>
            <Text dimColor>in {fmt(t.input)} · out {fmt(t.output)} · cache {fmt(t.cache)}</Text>
            <Text><Text bold>$  </Text><Text color="#f2b705">US$ {cost.toFixed(2)}</Text></Text>
            <Text dimColor>{t.missions} missões concluídas</Text>
          </Box>
        </Box>
      </Box>
    )
  })
}
