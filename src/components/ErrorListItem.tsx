import * as React from "react";
import { ErrorMessage } from "formik";

export const ErrorListItem: React.FC<{ name: string }> = ({ name }) => (
  <ErrorMessage name={name}>{message => <li>{message}</li>}</ErrorMessage>
);
