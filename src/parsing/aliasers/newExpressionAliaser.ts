import { NewExpression, SourceFile } from "typescript";

export class NewExpressionAliaser {
    private readonly sourceFile: SourceFile;

    public constructor(sourceFile: SourceFile) {
        this.sourceFile = sourceFile;
    }

    public getFriendlyTypeName(node: NewExpression): string {
        return node.expression.getText(this.sourceFile);
    }
}
