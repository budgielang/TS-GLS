import { CaseStyle, CommandNames } from "general-language-syntax";
import * as ts from "typescript";

import { UnsupportedComplaint } from "../../output/complaint";
import { GlsLine } from "../../output/glsLine";
import { Transformation } from "../../output/transformation";
import { NodeVisitor } from "../visitor";

export class MethodSignatureVisitor extends NodeVisitor {
    public visit(node: ts.MethodSignature) {
        const returnType = this.aliaser.getFriendlyReturnTypeName(node);
        if (returnType === undefined) {
            return UnsupportedComplaint.forNode(node, this.sourceFile, "Could not parse method return type.");
        }

        const parameters = this.accumulateParameters(node.parameters);
        if (parameters instanceof UnsupportedComplaint) {
            return parameters;
        }

        const nameSplit = this.nameSplitter.split(node.name.getText(this.sourceFile));
        const name = this.casing.convertToCase(CaseStyle.PascalCase, nameSplit);

        return [
            Transformation.fromNode(
                node,
                this.sourceFile,
                [
                    new GlsLine(CommandNames.InterfaceMethod, name, returnType, ...parameters)
                ])
        ];
    }

    private accumulateParameters(declarations: ReadonlyArray<ts.ParameterDeclaration>) {
        const parameters: (string | GlsLine)[] = [];

        for (const declaration of declarations) {
            const typeName = this.aliaser.getFriendlyTypeName(declaration);
            if (typeName === undefined) {
                return UnsupportedComplaint.forUnsupportedTypeNode(declaration, this.sourceFile);
            }

            parameters.push(declaration.name.getText(this.sourceFile));
            parameters.push(typeName);
        }

        return parameters;
    }
}
