import { useState } from "react";
import type { ItemCategory, YarnWeight } from "../../types/models";
import { FormActions } from "./shared/FormActions";
import { FormField } from "./shared/FormField";
import { FormSection } from "./shared/FormSection";
import { SelectInput } from "./shared/SelectInput";
import { TextArea } from "./shared/TextArea";
import { TextInput } from "./shared/TextInput";

export type StashFormValues = {
  category: ItemCategory;
  name: string;
  quantity: number | "";
  unit: string;
  brand: string;
  color: string;
  weight: YarnWeight | "";
  size: string;
  material: string;
  notes: string;
};

type StashFormProps = {
  initialValues?: Partial<StashFormValues>;
  onSubmit: (values: StashFormValues) => void;
  onCancel?: () => void;
};

type FormErrors = Partial<Record<"name" | "quantity", string>>;

const defaultUnits: Record<ItemCategory, string> = {
  yarn: "skeins",
  hook: "hooks",
  needle: "needles",
  eyes: "pairs",
  stuffing: "bags",
  other: "items",
};

export function StashForm({
  initialValues,
  onSubmit,
  onCancel,
}: StashFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<StashFormValues>({
    category: initialValues?.category ?? "yarn",
    name: initialValues?.name ?? "",
    quantity: initialValues?.quantity ?? "",
    unit: initialValues?.unit ?? defaultUnits[initialValues?.category ?? "yarn"],
    brand: initialValues?.brand ?? "",
    color: initialValues?.color ?? "",
    weight: initialValues?.weight ?? "",
    size: initialValues?.size ?? "",
    material: initialValues?.material ?? "",
    notes: initialValues?.notes ?? "",
  });

  function update<K extends keyof StashFormValues>(key: K, value: StashFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "category") {
        const category = value as ItemCategory;
        next.unit = defaultUnits[category];

        if (!showsWeight(category)) next.weight = "";
        if (!showsBrand(category)) next.brand = "";
        if (!showsColor(category)) next.color = "";
        if (!showsSize(category)) next.size = "";
        if (!showsMaterial(category)) next.material = "";
        if (!showsNotes(category)) next.notes = "";
      }

      return next;
    });

    if (key === "name" || key === "quantity") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (values.quantity === "" || Number.isNaN(Number(values.quantity))) {
      nextErrors.quantity = "Quantity is required.";
    } else if (Number(values.quantity) < 0) {
      nextErrors.quantity = "Quantity must be zero or more.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit(values);
  }

  const showBrand = showsBrand(values.category);
  const showColor = showsColor(values.category);
  const showWeight = showsWeight(values.category);
  const showSize = showsSize(values.category);
  const showMaterial = showsMaterial(values.category);
  const showUnit = showsUnit(values.category);
  const showNotes = showsNotes(values.category);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormSection title="Basic Info">
        <FormField label="Category">
          <SelectInput
            value={values.category}
            onChange={(event) => update("category", event.target.value as ItemCategory)}
          >
            <option value="yarn">Yarn</option>
            <option value="hook">Hook</option>
            <option value="needle">Needle</option>
            <option value="eyes">Safety Eyes</option>
            <option value="stuffing">Stuffing</option>
            <option value="other">Other</option>
          </SelectInput>
        </FormField>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Name">
            <TextInput
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Item name"
            />
            {errors.name ? <p className="text-sm text-rose-600">{errors.name}</p> : null}
          </FormField>

          <FormField label="Quantity">
            <TextInput
              type="number"
              min="0"
              value={values.quantity}
              onChange={(event) =>
                update("quantity", event.target.value === "" ? "" : Number(event.target.value))
              }
              placeholder="0"
            />
            {errors.quantity ? <p className="text-sm text-rose-600">{errors.quantity}</p> : null}
          </FormField>

          {showUnit ? (
            <FormField label="Unit">
              <TextInput
                value={values.unit}
                onChange={(event) => update("unit", event.target.value)}
                placeholder="skeins, bags, items"
              />
            </FormField>
          ) : null}
        </div>
      </FormSection>

      {showBrand || showColor || showWeight || showSize || showMaterial ? (
        <FormSection title="Item Details">
          <div className="grid gap-3 sm:grid-cols-2">
            {showBrand ? (
              <FormField label="Brand">
                <TextInput
                  value={values.brand}
                  onChange={(event) => update("brand", event.target.value)}
                  placeholder="Brand name"
                />
              </FormField>
            ) : null}

            {showColor ? (
              <FormField label="Color">
                <TextInput
                  value={values.color}
                  onChange={(event) => update("color", event.target.value)}
                  placeholder="Color name"
                />
              </FormField>
            ) : null}

            {showWeight ? (
              <FormField label="Yarn Weight">
                <SelectInput
                  value={values.weight}
                  onChange={(event) => update("weight", event.target.value as YarnWeight | "")}
                >
                  <option value="">Select weight</option>
                  <option value="lace">Lace</option>
                  <option value="fingering">Fingering</option>
                  <option value="sport">Sport</option>
                  <option value="dk">DK</option>
                  <option value="worsted">Worsted</option>
                  <option value="bulky">Bulky</option>
                  <option value="super-bulky">Super Bulky</option>
                </SelectInput>
              </FormField>
            ) : null}

            {showSize ? (
              <FormField label="Size">
                <TextInput
                  value={values.size}
                  onChange={(event) => update("size", event.target.value)}
                  placeholder="4 mm, 12 mm"
                />
              </FormField>
            ) : null}

            {showMaterial ? (
              <FormField label="Material">
                <TextInput
                  value={values.material}
                  onChange={(event) => update("material", event.target.value)}
                  placeholder="Steel, bamboo, polyester"
                />
              </FormField>
            ) : null}
          </div>
        </FormSection>
      ) : null}

      {showNotes ? (
        <FormSection title="Notes">
          <FormField label="Notes">
            <TextArea
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Optional item notes"
            />
          </FormField>
        </FormSection>
      ) : null}

      <FormActions submitLabel="Save Stash Item" onCancel={onCancel} />
    </form>
  );
}

function showsWeight(category: ItemCategory) {
  return category === "yarn" || category === "other";
}

function showsBrand(category: ItemCategory) {
  return ["yarn", "hook", "needle", "eyes", "other"].includes(category);
}

function showsColor(category: ItemCategory) {
  return category === "yarn" || category === "other";
}

function showsSize(category: ItemCategory) {
  return ["hook", "needle", "eyes", "other"].includes(category);
}

function showsMaterial(category: ItemCategory) {
  return ["hook", "needle", "eyes", "stuffing", "other"].includes(category);
}

function showsUnit(category: ItemCategory) {
  return ["yarn", "stuffing", "other"].includes(category);
}

function showsNotes(category: ItemCategory) {
  return ["yarn", "stuffing", "other"].includes(category);
}
