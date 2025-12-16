import { CHAT_DELIMETER } from '../constants';
import { escapeDangerousCharacters } from './parsers';

function convertTextToMsg(text: string, assistantName: string = 'Assistant') {
	const agentMarker = `**${assistantName}:**`;
	const agentMarkerRegex = new RegExp(
		`^${escapeDangerousCharacters(agentMarker)}`,
	);
	if (text.match(agentMarkerRegex)) {
		/** is assistant */
		return {
			role: 'assistant',
			content: text.replace(agentMarkerRegex, '').trim(),
		};
	} else {
		/** is user */
		return { role: 'user', content: text };
	}
}

function buildAssistantMsg(text: string, assistantName: string = 'Assistant') {
	const agentMarker = `**${assistantName}:**`;
	return CHAT_DELIMETER + `${agentMarker} ${text}` + CHAT_DELIMETER;
}

export { buildAssistantMsg, convertTextToMsg };
