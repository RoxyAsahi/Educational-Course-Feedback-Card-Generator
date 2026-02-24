/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KnowledgePoint {
  id: string;
  point: string;
  difficulty: number; // 1-5
  frequency: string;
  type: string;
}

export interface FeedbackData {
  cardTitle: string;
  studentName: string;
  courseName: string;
  dateRange: string;
  calendarYear: number;
  calendarMonth: number;
  calendarDays: number[]; // Days to highlight
  knowledgePoints: KnowledgePoint[];
  skillSchoolTitle: string;
  statsTitle: string;
  statsLabels: {
    knowledge: string;
    problems: string;
    test: string;
  };
  stats: {
    knowledgeCount: number;
    problemsSolved: number;
    testResult: string;
  };
  comprehensiveComment: string;
  performance: {
    attendance: string;
    interaction: string;
    completion: string;
    classroomPerformance: string;
  };
  themeColor: string;
}

export const SPRING_PRESET: FeedbackData = {
  cardTitle: "春季班学习反馈卡",
  studentName: "杨晨晢",
  courseName: "全人数学春季班",
  dateRange: "春季C03第X次课",
  calendarYear: 2026,
  calendarMonth: 2,
  calendarDays: [24],
  knowledgePoints: [
    { id: '1', point: '三角形的概念和性质', difficulty: 3, frequency: '85%', type: '基础填空' },
    { id: '2', point: '三角形的内角和', difficulty: 3, frequency: '90%', type: '几何证明' },
    { id: '3', point: '全等三角形的概念', difficulty: 2, frequency: '80%', type: '概念选择' },
    { id: '4', point: '全等三角形判定一', difficulty: 4, frequency: '95%', type: '综合大题' },
  ],
  skillSchoolTitle: "技能学堂",
  statsTitle: "全人春季班学习统计卡",
  statsLabels: {
    knowledge: "累计学习知识量",
    problems: "累计完成做题量",
    test: "今日全人学习结果"
  },
  stats: {
    knowledgeCount: 21,
    problemsSolved: 52,
    testResult: "A+"
  },
  comprehensiveComment: "晨晢今天在数学课堂上的表现非常出色。在学习《三角形的概念和性质》时，他能够迅速理解边角关系，并能准确应用内角和定理解决复杂的角度计算问题。特别是在接触《全等三角形判定》这一难点时，他展现出了严谨的逻辑推理能力，证明过程书写规范，思路清晰。\n\n在课堂互动环节，晨晢积极思考，对于老师提出的变式问题能举一反三。目前对于基础概念掌握牢固，但在处理多图形嵌套的综合证明题时，还需进一步加强对辅助线构造的敏感度。建议课后针对全等判定的第一种情况多做练习，巩固证明逻辑。继续保持这种钻研精神，加油！",
  performance: {
    attendance: "准时",
    interaction: "100%-独立和思考",
    completion: "100%",
    classroomPerformance: "听课时能集中注意力,在沟通环节积极参与讨论,当老师提出问题时能积极参与发言"
  },
  themeColor: "#007BFF"
};

export const AFTER_SCHOOL_PRESET: FeedbackData = {
  cardTitle: "晚托班学习反馈卡",
  studentName: "杨晨晢",
  courseName: "全人晚托班",
  dateRange: "2月24日 晚托服务",
  calendarYear: 2026,
  calendarMonth: 2,
  calendarDays: [24],
  knowledgePoints: [
    { id: '1', point: '数学作业完成', difficulty: 3, frequency: '100%', type: '作业辅导' },
    { id: '2', point: '语文背诵默写', difficulty: 2, frequency: '100%', type: '基础过关' },
    { id: '3', point: '英语单词听写', difficulty: 3, frequency: '95%', type: '词汇巩固' },
    { id: '4', point: '自主预习复习', difficulty: 2, frequency: '100%', type: '习惯培养' },
  ],
  skillSchoolTitle: "成长记录",
  statsTitle: "全人晚托班成长统计卡",
  statsLabels: {
    knowledge: "今日作业完成度",
    problems: "错题订正情况",
    test: "学习专注度评分"
  },
  stats: {
    knowledgeCount: 100,
    problemsSolved: 10,
    testResult: "优秀"
  },
  comprehensiveComment: "晨晢今天在晚托班的表现非常自律。学校布置的数学和语文作业均在规定时间内高质量完成，书写工整规范。在英语单词默写环节，表现出色，仅有个别拼写错误并已当场订正。\n\n完成作业后，他能主动进行课外阅读和自主复习，没有出现分心现象。建议家长在家中继续鼓励他保持这种高效的学习节奏，特别是在书写细节上可以更上一层楼。总体表现非常棒！",
  performance: {
    attendance: "准时",
    interaction: "积极主动",
    completion: "100%",
    classroomPerformance: "作业书写规范，专注度高，能独立思考并解决作业中的难题，遇到不懂的能主动询问老师。"
  },
  themeColor: "#4ADE80"
};

export const DEFAULT_DATA: FeedbackData = SPRING_PRESET;
