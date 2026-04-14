import { AssetCategoryId } from '../types';

export interface GuideStep {
  step: number;
  title: string;
  detail: string;
}

export interface CategoryGuide {
  categoryId: AssetCategoryId;
  title: string;
  overview: string;
  steps: GuideStep[];
}

/** 8カテゴリ別 相続時の一般的な手続フロー */
export const GUIDES: CategoryGuide[] = [
  {
    categoryId: 'deposit',
    title: '預貯金',
    overview: '被相続人の死亡届が提出されると、金融機関が情報を把握した時点で口座が凍結されます。払戻しには相続人全員の合意が必要です。',
    steps: [
      { step: 1, title: '口座凍結の確認', detail: '金融機関に死亡の届出を行い、口座の凍結を確認します。' },
      { step: 2, title: '残高証明書の取得', detail: '各金融機関に残高証明書を請求します。' },
      { step: 3, title: '必要書類の準備', detail: '除籍謄本（被相続人の出生から死亡まで）、相続人全員の戸籍謄本、遺産分割協議書、印鑑証明書を準備します。' },
      { step: 4, title: '払戻し手続', detail: '金融機関の窓口で所定の相続届出書と必要書類を提出し、払戻しまたは名義変更を行います。' },
    ],
  },
  {
    categoryId: 'stock',
    title: '株式・投資信託',
    overview: '上場株式や投資信託は証券会社を通じて名義変更を行います。',
    steps: [
      { step: 1, title: '証券会社への届出', detail: '被相続人の取引口座がある証券会社に死亡の届出を行います。' },
      { step: 2, title: '残高証明書の取得', detail: '証券会社から残高証明書を取得します。' },
      { step: 3, title: '相続人の口座開設', detail: '受け取る相続人が同じ証券会社に口座を持っていない場合、新規に口座を開設します。' },
      { step: 4, title: '名義変更（移管）', detail: '遺産分割協議書等の必要書類を提出し、株式・投信を相続人の口座に移管します。' },
    ],
  },
  {
    categoryId: 'bond',
    title: '債券',
    overview: '国債・社債は証券会社または銀行で名義変更します。個人向け国債は中途換金も可能です。',
    steps: [
      { step: 1, title: '保有先への届出', detail: '証券会社または銀行に被相続人の死亡を届け出ます。' },
      { step: 2, title: '残高の確認', detail: '保有銘柄・額面を確認します。' },
      { step: 3, title: '名義変更', detail: '必要書類（戸籍謄本・遺産分割協議書等）を提出し名義を変更します。' },
      { step: 4, title: '換金または継続保有', detail: '相続人の判断で満期まで保有するか、中途売却・換金します。' },
    ],
  },
  {
    categoryId: 'insurance',
    title: '生命保険',
    overview: '死亡保険金は受取人固有の財産であり、原則として遺産分割の対象外です。',
    steps: [
      { step: 1, title: '保険会社への連絡', detail: '保険証券を確認し、保険会社のコールセンターに死亡を連絡します。' },
      { step: 2, title: '必要書類の確認', detail: '保険会社から請求書類一式が送付されます。死亡診断書（コピー可）、受取人の本人確認書類等を準備します。' },
      { step: 3, title: '保険金請求', detail: '請求書に必要事項を記入し、書類一式を返送します。' },
      { step: 4, title: '保険金受取', detail: '書類到着後、通常5〜10営業日で指定口座に振り込まれます。' },
    ],
  },
  {
    categoryId: 'realestate',
    title: '不動産',
    overview: '不動産は法務局で相続登記を行います。2024年4月1日から相続登記が義務化され、3年以内の申請が必要です。',
    steps: [
      { step: 1, title: '不動産の特定', detail: '固定資産税納税通知書や登記事項証明書で所有不動産を確認します。' },
      { step: 2, title: '遺産分割協議', detail: '相続人全員で誰がどの不動産を取得するか協議し、遺産分割協議書を作成します。' },
      { step: 3, title: '相続登記', detail: '法務局に登記申請書と添付書類（戸籍謄本・遺産分割協議書・住民票等）を提出します。' },
      { step: 4, title: '固定資産税の届出', detail: '市区町村に新しい所有者として届け出ます。' },
    ],
  },
  {
    categoryId: 'metal',
    title: '貴金属',
    overview: '金・銀・プラチナ等の地金は、遺産分割の対象です。',
    steps: [
      { step: 1, title: '現物の確認', detail: '自宅の金庫や貸金庫に保管されている貴金属・宝飾品を確認します。' },
      { step: 2, title: '遺産分割', detail: '現物を分割するか、売却して金銭で分けるか、相続人間で協議します。' },
      { step: 3, title: '名義変更等', detail: '地金商に預けている場合は名義変更手続を行います。' },
    ],
  },
  {
    categoryId: 'crypto',
    title: '暗号資産',
    overview: '暗号資産も相続財産です。取引所に預けている分は取引所に連絡し、ウォレットの分はシードフレーズ（秘密鍵）が必要です。',
    steps: [
      { step: 1, title: '取引所への届出', detail: '利用していた暗号資産取引所に死亡を届け出ます。' },
      { step: 2, title: '残高の確認', detail: '保有数量を確認します（取引所が残高証明を発行）。' },
      { step: 3, title: '相続人への移管', detail: '必要書類を提出し、相続人の口座に暗号資産を移管します（相続人も同取引所に口座が必要な場合あり）。' },
      { step: 4, title: '自己管理ウォレットの対応', detail: 'ハードウェアウォレットやソフトウェアウォレットの場合、シードフレーズ（復元用の単語列）がないとアクセスできません。' },
    ],
  },
  {
    categoryId: 'other',
    title: 'その他',
    overview: '車、美術品、ゴルフ会員権、貸付金など、金銭的価値のある財産はすべて相続の対象となります。',
    steps: [
      { step: 1, title: '財産の洗い出し', detail: '自動車（車検証確認）、美術品、ゴルフ会員権、貸付金、未収入金など、あらゆる財産を洗い出します。' },
      { step: 2, title: '名義変更', detail: '自動車は運輸支局で移転登録、ゴルフ会員権はクラブに届出、貸付金は債務者に相続の通知を行います。' },
      { step: 3, title: '処分・売却', detail: '不要なものは売却し、売却代金を相続人間で分配することもできます。' },
    ],
  },
];
