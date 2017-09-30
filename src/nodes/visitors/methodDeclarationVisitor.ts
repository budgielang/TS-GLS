import { CaseStyle, CommandNames } from "general-language-syntax";
import { hasModifier } from "tsutils";
import { MethodDeclaration, ParameterDeclaration, SignatureKind, SyntaxKind } from "typescript";

import { GlsLine } from "../../glsLine";
import { Transformation } from "../../transformation";
import { NodeVisitor } from "../visitor";

export class MethodDeclarationVisitor extends NodeVisitor {
    public visit(node: MethodDeclaration) {
        if (node.body === undefined) {
            return undefined;
        }

        const returnType = this.aliaser.getFriendlyReturnTypeName(node);
        if (returnType === undefined) {
            return undefined;
        }

        const parameters = this.accumulateParameters(node.parameters);
        if (parameters === undefined) {
            return undefined;
        }

        const privacy = this.aliaser.getFriendlyPrivacyName(node);
        const nameRaw = node.name.getText(this.sourceFile);
        const name = this.casing.getConverter(CaseStyle.PascalCase).convert([nameRaw]);
        const [commandStart, commandEnd] = this.getCommandNames(node);

        return [
            Transformation.fromNode(
                node,
                this.sourceFile,
                [
                    new GlsLine(commandStart, privacy, name, returnType, ...parameters),
                    ...this.router.recurseIntoNodes(node.body.statements),
                    new GlsLine(commandEnd)
                ])
        ];
    }

    private accumulateParameters(declarations: ReadonlyArray<ParameterDeclaration>) {
        const parameters: (string | GlsLine)[] = [];

        for (const declaration of declarations) {
            const typeName = this.aliaser.getFriendlyTypeName(declaration);
            if (typeName === undefined) {
                return undefined;
            }

            parameters.push(declaration.name.getText(this.sourceFile));
            parameters.push(typeName);
        }

        return parameters;
    }

    private getCommandNames(node: MethodDeclaration) {
        return hasModifier(node.modifiers, SyntaxKind.StaticKeyword)
            ? [CommandNames.StaticFunctionDeclareStart, CommandNames.StaticFunctionDeclareEnd]
            : [CommandNames.MemberFunctionDeclareStart, CommandNames.MemberFunctionDeclareEnd];
    }
}
