/*
{% capture options_ids %}
[
{%- for option in product.options_with_values -%}
  {%- for value in option.values -%}
    "{{ section.id }}-{{ option.position }}-{{ forloop.index0 -}}"
    {% unless forloop.last %},{% endunless %}
  {% endfor %}
{% endfor -%}
]
{% endcapture %}

<script data-ref="variant-ids" type="application/json">
  [{%- for variant in product.variants -%}
    {
      "id": "{{ variant.id }}",
      "pre_order": "{{ variant.metafields.custom.pre_order }}",
      "pre_order_formatted_date": "{{ variant.metafields.custom.pre_order | date: "%F" | date: format: "complete_date" }}",
      "price": {{ variant.price }},
      "title": "{{ variant.title }}",
      "available": {{ variant.available }}
    }
    {% unless forloop.last %},{% endunless %}
  {%- endfor -%}]
</script>

<script data-ref="product-datas" type="application/json">
  {
    "product": {{ product | json }},
    "selected_or_first_available_variant": {{ product.selected_or_first_available_variant | json }},
    "localText": {
      "pre_order": {
        "pre_ordable_for_the": "{{ 'products.product.pre_order.pre_ordable_for_the' | t }}",
        "pre_order_delivery_date": "{{ 'products.product.pre_order.pre_order_delivery_date' | t }}"
      }
    },
    "productFormId": "{{ product_form_id }}",
    "options_ids": {{ options_ids | strip_newlines }},
    "sectionId": "{{ section.id }}"
  }
</script>

<script src="{{ 'product-preorder.js' | asset_url }}" defer></script>
*/

(function () {
  // Parsing initial data
  const variants = JSON.parse(
    document.querySelector('script[data-ref="variant-ids"]').textContent
  );
  const data = JSON.parse(
    document.querySelector('script[data-ref="product-datas"]').textContent
  );
  const { localText, product } = data;

  let variantDict = {};
  let preorders = {};

  // Populate variant dictionary
  variants.forEach((variant) => (variantDict[variant.id] = variant));

  // Fill preorder data
  function fillPreorders() {
    variants.forEach((variant) => {
      if (
        variant.pre_order.length > 0 &&
        Date.parse(variant.pre_order) > Date.now()
      ) {
        preorders[variant.id] = {
          value: variant.pre_order,
          pre_order_formatted_date: variant.pre_order_formatted_date,
        };
      }
    });
  }

  fillPreorders();

  // Add event listener for variant selection
  function variantSelectListener() {
    const parentElement = document.querySelector(
      `section[id="ProductInfo-${data.sectionId}"]`
    );
    if (!parentElement) return;

    parentElement.addEventListener("change", (event) => {
      const selectedVariant = variants.find(
        (variant) => variant.title === event.target.value
      );
      if (selectedVariant) displayVariantPreorder(selectedVariant.id);
    });
  }

  variantSelectListener();

  // Get query parameter
  function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
  }

  // Create or update the preorder tag
  function createPreorderTag(variantId) {
    const variant = variantDict[variantId];
    const h3 = document.getElementById("variant-preorder-h3");
    const p = document.getElementById("variant-preorder-p");

    if (variant?.available && variantId in preorders) {
      const preOrderDate = preorders[variantId].pre_order_formatted_date;
      h3.innerText = `${localText.pre_order.pre_ordable_for_the} ${preOrderDate}`;

      let label = document.getElementById("preorder-label");
      if (!label) {
        label = document.createElement("label");
        label.id = "preorder-label";
        label.setAttribute("for", "variant-delivery-date");
        label.innerText = localText.pre_order.pre_order_delivery_date;
        p.appendChild(label);
      }

      let input = document.getElementById("variant-delivery-date");
      if (!input) {
        input = document.createElement("input");
        input.id = "variant-delivery-date";
        input.type = "text";
        input.name = `properties[${localText.pre_order.pre_order_delivery_date}]`;
        input.setAttribute("form", data.productFormId);
        p.appendChild(input);
      }

      input.value = preOrderDate;
    } else {
      h3.innerText = "";
      document.getElementById("preorder-label")?.remove();
      document.getElementById("variant-delivery-date")?.remove();
    }
  }

  // Display the preorder tag for a selected variant
  function displayVariantPreorder(variantId) {
    const selectedVariant =
      variantDict[variantId] || data.selected_or_first_available_variant;
    if (selectedVariant) {
      createPreorderTag(selectedVariant.id);
    } else {
      console.log("No valid variant found or not a preorder.");
    }
  }

  // Check if the variant in the URL is available for preorder
  function checkVariantPreorder() {
    const variantId = getQueryParam("variant");
    displayVariantPreorder(variantId);
  }

  checkVariantPreorder();
})();
