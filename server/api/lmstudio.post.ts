// server/api/lmstudio.post.ts
const laborSchema = {
	type: "object",
	properties: {
		user_input_zh: { type: "string" },
		benefit_types: {
			type: "array",
			items: {
				type: "string",
				enum: ["醫療給付", "傷病給付", "失能給付"],
			},
		},
		state: {
			type: "object",
			properties: {
				applicant_role: { type: "string" },
				accident_date: { type: "string" }, // "2025-11-25"
				accident_time: { type: "string" }, // "20:00"
				accident_place: { type: "string" }, // 縣市 / 大致地點

				// 🔸 新增：事故詳細地址，對應你 formRaw.injuryReport.injuryPlace.address
				accident_address: {
					type: "string",
					description: "事故發生的詳細地址，若使用者未提供請用空字串",
				},

				accident_type: { type: "string" },
				employer_name: { type: "string" },
				insured_status: { type: "string" },
				medical_provider: { type: "string" },
				diagnosis_text: { type: "string" },

				// 🔸 新增：實際工作內容 → formRaw.injuryReport.jobContent
				job_content: {
					type: "string",
					description: "受傷當時實際在做的工作內容",
				},

				// 🔸 原本就有
				treatment_dates: {
					type: "array",
					items: { type: "string" }, // "YYYY-MM-DD"
				},

				documents_ready: {
					type: "array",
					items: { type: "string" },
				},

				// 🔸 新增：是否已恢復工作 & 恢復日期
				has_returned: {
					type: "boolean",
					description: "若尚未復工，請為 false",
				},
				return_date: {
					type: "string",
					description:
						"復工日期，格式 YYYY-MM-DD；若尚未復工請用空字串",
				},

				// 🔸 新增：化學物質相關
				exposed_to_chemical: {
					type: "boolean",
					description: "是否有接觸特定化學物質，若沒有請為 false",
				},
				chemical_name: {
					type: "string",
					description: "化學物質名稱；若無接觸請用空字串",
				},
			},
			required: [
				"applicant_role",
				"accident_date",
				"accident_time",
				"accident_place",
				"accident_type",
				"employer_name",
				"insured_status",
				"medical_provider",
				"diagnosis_text",
				"treatment_dates",
				"documents_ready",

				// 🔸 這些看你要不要「硬性必填」，建議：
				//    - has_returned：必填（一定要問）
				//    - return_date：不要列進 required，因為可能沒復工
				//    - job_content：可以列 required（很重要）
				"job_content",
				"has_returned",
				// ⚠️ "return_date"、"accident_address"、"chemical_name" 建議不要放 required
			],
		},
		relative_time: {
			type: "object",
			properties: {
				accident_date: {
					oneOf: [
						{ type: "null" },
						{
							type: "object",
							properties: {
								expression: { type: "string" },
								days_offset: { type: "integer" },
							},
							required: ["expression", "days_offset"],
						},
					],
				},
				// 🟢 修改 3：拿掉 uniqueItems
				treatment_dates: {
					type: "array",
					items: {
						type: "object",
						properties: {
							expression: { type: "string" },
							days_offset: { type: "integer" },
						},
						required: ["expression", "days_offset"],
					},
				},
			},
			required: ["accident_date", "treatment_dates"],
		},
		missing: {
			type: "array",
			items: { type: "string" },
		},
		next_questions: {
			type: "array",
			items: { type: "string" },
			minItems: 1,
			maxItems: 1,
		},
		done: { type: "boolean" },
		done_message: { type: "string" },
		notes: {
			type: "array",
			items: { type: "string" },
		},
	},
	required: [
		"user_input_zh",
		"benefit_types",
		"state",
		"relative_time",
		"missing",
		"next_questions",
		"done",
		"done_message",
		"notes",
	],
};

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	const payload = {
		model: "qwen2.5-7b-instruct-1m", // 再次確認跟 LM Studio GUI 上名字一模一樣
		...body,
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "LaborBenefitCollector",
				schema: laborSchema,
			},
		},
	};

	// （可選）如果你懶得看 log，可以暫時註解掉
	console.log(
		"[lmstudio] request payload:",
		JSON.stringify(payload, null, 2)
	);

	try {
		const data = await $fetch("http://127.0.0.1:1234/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: "Bearer lm-studio",
			},
			body: payload,
		});

		return data;
	} catch (err) {
		// 讓錯誤內容清楚一點，之後真的還有問題會好查
		// @ts-ignore
		console.error(
			"[lmstudio] error status:",
			err?.statusCode,
			err?.statusMessage
		);
		// @ts-ignore
		console.error(
			"[lmstudio] error data:",
			// 有些版本錯誤在 err.data，有些在 err.response._data
			err?.data || err?.response?._data || err
		);

		throw createError({
			// @ts-ignore
			statusCode: err?.statusCode || 500,
			statusMessage: err?.statusMessage || "LM Studio error",
			// @ts-ignore
			data: err?.data || err?.response?._data || null,
		});
	}
});
