import { DocumentFormattingEditProvider, TextDocument, FormattingOptions, CancellationToken, ProviderResult, TextEdit, DocumentRangeFormattingEditProvider } from 'vscode';
import { FormattingRules, RuleMatch } from './formmatingRules';

class Formatting implements DocumentFormattingEditProvider {
	lineContinue: boolean = false;
	// Regras de estruturas que não sofrem identação interna
	structsNoIdent: string[] = ['beginsql (alias)?', 'Comentários'];

	provideDocumentFormattingEdits(document: TextDocument,
		options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {

		const formattingRules = new FormattingRules();
		const tab: string = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
		let identBlock: string = "";
		let cont: number = 0;

		let result: TextEdit[] = [];
		const lc = document.lineCount;
		const rulesIgnored: any[] = formattingRules.getClosedStructures().filter(
			(rule) => { return this.structsNoIdent.indexOf(rule.id) !== -1; }
		);

		for (let nl = 0; nl < lc; nl++) {
			console.log(nl);
			const line = document.lineAt(nl);
			let lastRule: string = formattingRules.openStructures[formattingRules.openStructures.length - 1];
			let foundIgnore: any[] = rulesIgnored.filter((rule) => { return rule.id === lastRule; });
			// dentro do BeginSql não mexe na identação
			if ((foundIgnore.length > 0 && !line.text.match(foundIgnore[0].end))) {
				result.push(TextEdit.replace(line.range, line.text.trimRight()));
			} else {
				if ((!line.isEmptyOrWhitespace) && (formattingRules.match(line.text)) && (!this.lineContinue)) {
					let ruleMatch: RuleMatch | null = formattingRules.getLastMatch();

					if (ruleMatch) {
						if (ruleMatch.decrement) {
							cont = cont < 1 ? 0 : cont - 1;
							identBlock = tab.repeat(cont);
						}
					}

					const newLine: string = line.text.replace(/(\s*)?/, identBlock ).trimRight();
					result.push(TextEdit.replace(line.range, newLine));
					this.lineContinue = newLine.endsWith(';');

					if (ruleMatch) {
						if (ruleMatch.increment) {
							cont++;
							identBlock = tab.repeat(cont);
						}
					}
				} else {
					let newLine: string = '';
					if (!line.isEmptyOrWhitespace) {
						newLine = line.text.replace(/(\s*)?/, identBlock + (this.lineContinue ? tab : "")).trimRight();
					}
					result.push(TextEdit.replace(line.range, newLine));
					this.lineContinue = newLine.endsWith(';');
				}
			}
		}

		return result;
	}
}

class RangeFormatting implements DocumentRangeFormattingEditProvider {

	provideDocumentRangeFormattingEdits(document: TextDocument, range: import("vscode").Range, options: FormattingOptions, token: CancellationToken): ProviderResult<TextEdit[]> {
		throw new Error("Method not implemented.");
	}
}

const formatter = new Formatting();
const rangeFormatter = new RangeFormatting();

export function formattingEditProvider() {
	return formatter;
}

export function rangeFormattingEditProvider() {
	return rangeFormatter;
}