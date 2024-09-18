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
  const variants = JSON.parse(
    document.querySelector('script[data-ref="variant-ids"]').textContent
  );
  const data = JSON.parse(
    document.querySelector('script[data-ref="product-datas"]').textContent
  );
  let localText = data.localText;
  let product = data.product;
  let variantDict = {};
  let preorders = {};

  variants.forEach((variant) => {
    variantDict[variant.id] = variant;
  });

  function variantSelectListener() {
    let parentElement = document.querySelector(
      `section[id="ProductInfo-${data.sectionId}"]`
    );

    if (parentElement) {
      parentElement.addEventListener("change", function (event) {
        data.options_ids.forEach((id) => {
          if (event.target && event.target.matches(`input[id="${id}"]`)) {
            const selectedVariant = variants.find(
              (el) => el.title == event.target.value
            );
            displayVariantPreorder(selectedVariant.id);
          }
        });
      });
    }
  }

  variantSelectListener();

  function fillPreorders() {
    for (let i = 0; i < variants.length; i++) {
      if (
        variants[i].pre_order.length > 0 &&
        Date.parse(variants[i].pre_order) > Date.now()
      )
        preorders[variants[i].id] = {
          value: variants[i].pre_order,
          pre_order_formatted_date: variants[i].pre_order_formatted_date,
        };
    }
  }

  fillPreorders();

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function createPreorderTag(variantId) {
    if (variantDict[variantId].available && variantId in preorders) {
      const h3 = document.getElementById("variant-preorder-h3");
      h3.innerText = `${localText.pre_order.pre_ordable_for_the} ${preorders[variantId].pre_order_formatted_date}`;
      let label = document.getElementById("preorder-label");
      const p = document.getElementById("variant-preorder-p");
      if (!label) {
        label = document.createElement("label");
        label.setAttribute("id", "preorder-label");
        label.setAttribute("for", "variant-delivery-date");
        label.innerText = `${localText.pre_order.pre_order_delivery_date}`;
        p.appendChild(label);
      }
      let input = document.getElementById("variant-delivery-date");
      if (!input) {
        input = document.createElement("input");
        input.setAttribute("id", "variant-delivery-date");
        input.setAttribute("type", "text");
        input.setAttribute(
          "name",
          `properties[${localText.pre_order.pre_order_delivery_date}]`
        );
        input.setAttribute("form", data.productFormId);
        p.appendChild(input);
      }
      input.setAttribute(
        "value",
        preorders[variantId].pre_order_formatted_date
      );
    } else {
      const h3 = document.getElementById("variant-preorder-h3");
      if (h3) h3.innerText = "";
      const label = document.getElementById("preorder-label");
      if (label) label.remove();
      const input = document.getElementById("variant-delivery-date");
      if (input) input.remove();
    }
  }

  function displayVariantPreorder(variantId) {
    if (variantId && variantDict[variantId]) {
      createPreorderTag(variantId);
    } else if (product.variants && product.variants.length > 0) {
      const selectedVariant = data.selected_or_first_available_variant;
      createPreorderTag(selectedVariant.id);
    } else {
      console.log("No variant parameter in URL or not preorder.");
    }
  }

  function checkVariantPreorder() {
    // console.log(data);
    const variantId = getQueryParam("variant");
    displayVariantPreorder(variantId);
  }

  checkVariantPreorder();
})();
