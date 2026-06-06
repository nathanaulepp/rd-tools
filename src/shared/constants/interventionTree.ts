export interface TreeNode {
  label: string;
  children?: TreeNode[];
}

export const INTERVENTION_TREE: TreeNode[] = [
  {
    label: "Food and/or Nutrient Delivery (ND)",
    children: [
      {
        label: "Class: Meals and Snacks",
        children: [
          {
            label: "Meals and Snacks",
            children: [
              { label: "General healthful diet" },
              { label: "Vegetarian diet" },
              { label: "Pesco vegetarian diet—defined as a vegetarian diet that includes fish and seafood, eggs, and mammalian milk-based food and excludes all other animal-based protein food and ingredients" },
              { label: "Lacto ovo vegetarian diet" },
              { label: "Lacto vegetarian diet" },
              { label: "Ovo vegetarian diet—defined as a vegetarian diet that includes eggs and excludes other animal-based food and ingredients" },
              { label: "Vegan diet—defined as a diet that excludes all animal-based foods and animal-based food and ingredients" },
              { label: "Halal diet—defined as a diet for clients of the Islamic faith and includes only foods considered acceptable. Foods not acceptable include pork, pork products, alcohol as well as other nonapproved food and food ingredients." },
              { label: "Kosher diet" },
              { label: "Mediterranean diet—defined as a diet of minimally processed plant foods with the majority of intake from vegetables, whole grains, fruits, extra virgin olive oil, legumes, nuts, seeds, and herbs, and dairy products (principally yogurt and cheese); moderate intake of fish and seafood; moderate to low intake of poultry; zero to four eggs per week; and low intake of red meat and discretionary foods, such as, sweets and sugar-sweetened beverage" },
              {
                label: "Texture modified diet",
                children: [
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Regular Level 7 (Black) food—defined as a diet that includes normal, everyday foods of various textures that are developmentally and age appropriate. Any method may be used to eat these foods and foods may be hard and crunchy or naturally soft. Sample size is not restricted at Level 7, therefore, foods may be of a range of sizes - pediatric smaller or greater than 8mm pieces and adult smaller or greater than 15 mm = 1.5 cm pieces. Includes hard, tough, chewy, fibrous, stringy, dry, crispy, crunchy, or crumbly bits. Includes food that contains pips, seeds, pith inside skin, husks or bones. Includes dual consistency or mixed consistency foods and liquids.*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Easy to Chew Level 7 (Black) food—defined as a diet that includes normal everyday foods of soft/tender textures that are developmentally and age appropriate. Any method may be used to eat these foods and sample size is not restricted at Level 7 therefore foods may be of a range of sizes: Smaller or greater than 8mm pieces (pediatric) smaller or greater than 15 mm = 1.5 cm pieces (adults). Does not include hard, tough, chewy, fibrous, stringy, crunchy or crumbly bits, pips, seeds, fibrous parts of fruit, husks or bones. May include dual consistency or mixed consistency foods and liquids if also safe for Level 0 and at clinician discretion. If unsafe for Level 0 Thin, liquid portion can be thickened to clinician's recommended thickness level.*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Soft and Bite Sized Level 6 (Blue) food—defined as a diet that includes foods that can be eaten with a fork, spoon or chopsticks and can be mashed or broken down with pressure from fork, spoon or chopsticks. A knife is not required to cut this food, but may be used to help load a fork or spoon. Soft, tender and most throughout but with no separate thin liquid. Chewing is required before swallowing. Bite-sized pieces as appropriate for size and oral processing skills - pediatric 8mm pieces (no larger than) and adults 15 mm = 1.5 cm pieces (no larger than).*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Minced and Moist Level 5 (Orange) food—defined as a diet that includes foods that can be eaten with a fork or spoon and could be eaten with chopsticks in some cases, if the individual has very good hand control. Can be scooped and shaped (eg into a ball shape) on a plate. Soft and moist with no separate thin liquid. Small lumps visible within the food - pediatric, equal to or less than 2 mm width and no longer than 8mm in length and adult, equal to or less than 4mm width and no longer than 15mm in length. Lumps are easy to squash with tongue.*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Pureed Level 4 (Green) food—defined as a diet that includes pureed food that is usually eaten with a spoon (a fork is possible). Cannot be drunk from a cup because it does not flow easily. Cannot be sucked through a straw and does not require chewing. Can be piped, layered or molded because it retains its shape, but should not require chewing if presented in this form. Shows some very slow movement under gravity but cannot be poured. Falls off spoon in a single spoonful when tilted and continues to hold shape on a plate. No lumps, not sticky and liquid must not separate from solid.*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Extremely Thick Level 4 (Green) drinks—defined as a diet that includes drinks that are usually eaten with a spoon (a fork is possible). Cannot be drunk from a cup because it does not flow easily. Cannot be sucked through a straw and does not require chewing. Can be piped, layered or molded because it retains its shape, but should not require chewing if presented in this form. Shows some very slow movement under gravity but cannot be poured. Falls off spoon in a single spoonful when tilted and continues to hold shape on a plate. No lumps, not sticky and liquid must not separate from solid.*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Liquidized Level 3 (Yellow) food—defined as a diet that includes liquidized foods that can be drunk from a cup. Moderate effort is required to suck through a standard bore or wide bore straw (wide bore straw = 0.275 inch or 6.9 mm). Cannot be piped, layered or molded on a plate because it will not retain its shape. Cannot be eaten with a fork because it drips slowly in dollops through the prongs. Can be eaten with a spoon. No oral processing or chewing required - can be swallowed directly. Smooth texture with no \"bits\" (lumps, fibers, bits of shell or skin, husk, particles of gristle or bone).*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Moderately Thick Level 3 (Yellow) drinks—defined as a diet that includes drinks that can be drunk from a cup. Moderate effort is required to suck through a standard bore or wide bore straw (wide bore straw = 0.275 inch or 6.9 mm). Cannot be piped, layered or molded on a plate because it will not retain its shape. Cannot be eaten with a fork because it drips slowly in dollops through the prongs. Can be eaten with a spoon. No oral processing or chewing required - can be swallowed directly. Smooth texture with no \"bits\" (lumps, fibers, bits of shell or skin, husk, particles of gristle or bone).*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Mildly Thick Level 2 (Pink) drinks—defined as a diet that includes drinks that flow off a spoon and are sippable, pour quickly from a spoon, but slower than thin drinks. Mild effort is required to drink this thickness through standard bore straw (standard bore straw = 0.209 inch or 5.3 mm diameter).*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Slightly Thick Level 1 (Grey) drinks—defined as a diet that includes drinks that are thicker than water and require a little more effort to drink than thin liquids. It flows through a straw, syringe, teat/nipple. Similar to the thickness of most commercially available anti-regurgitation (AR) infant formulas. IDDSI (International Dysphagia Diet Standardisation Initiative) Flow Test result shows that test liquid flows through a 10 ml slip tip syringe leaving 1-4 ml in the syringe after 10 seconds.*" },
                  { label: "International Dysphagia Diet Standardisation Initiative Framework - Thin Level 0 (White) drinks—defined as a diet that includes drinks that flow like water with a fast flow and can be drunk through any type of teat/nipple, cup or straw as appropriate for age and skills. IDDSI (International Dysphagia Diet Standardisation Initiative) Flow Test result shows less than 1 ml of test liquid remaining in the 10 ml slip tip syringe after 10 seconds of flow.*" },
                  { label: "Easy to chew diet" },
                  { label: "Mechanically altered diet" },
                  { label: "Pureed diet" },
                  { label: "Energy modified diet" },
                  { label: "Increased energy diet" },
                  { label: "Decreased energy diet" }
                ]
              },
              {
                label: "Protein modified diet",
                children: [
                  { label: "Consistent protein diet" },
                  { label: "Increased protein diet" },
                  { label: "Decreased protein diet" },
                  { label: "Decreased casein diet" },
                  { label: "Decreased gluten diet" },
                  { label: "Gluten free diet" }
                ]
              },
              {
                label: "Amino acid modified diet",
                children: [
                  {
                    label: "Arginine modified diet",
                    children: [
                      { label: "Increased arginine diet" },
                      { label: "Decreased arginine diet" }
                    ]
                  },
                  {
                    label: "Glutamine modified diet",
                    children: [
                      { label: "Increased glutamine diet" },
                      { label: "Decreased glutamine diet" }
                    ]
                  },
                  {
                    label: "Histidine modified diet",
                    children: [
                      { label: "Increased histidine diet" },
                      { label: "Decreased histidine diet" },
                      { label: "Increased homocysteine diet" }
                    ]
                  },
                  {
                    label: "Isoleucine modified diet",
                    children: [
                      { label: "Increased isoleucine diet" },
                      { label: "Decreased isoleucine diet" }
                    ]
                  },
                  {
                    label: "Leucine modified diet",
                    children: [
                      { label: "Increased leucine diet" },
                      { label: "Decreased leucine diet" }
                    ]
                  },
                  {
                    label: "Lysine modified diet",
                    children: [
                      { label: "Increased lysine diet" },
                      { label: "Decreased lysine diet" }
                    ]
                  },
                  {
                    label: "Methionine modified diet",
                    children: [
                      { label: "Increased methionine diet" },
                      { label: "Decreased methionine diet" }
                    ]
                  },
                  {
                    label: "Phenylalanine modified diet",
                    children: [
                      { label: "Increased phenylalanine diet" },
                      { label: "Decreased phenylalanine diet" }
                    ]
                  },
                  {
                    label: "Threonine modified diet",
                    children: [
                      { label: "Increased threonine diet" },
                      { label: "Decreased threonine diet" }
                    ]
                  },
                  {
                    label: "Tryptophan modified diet",
                    children: [
                      { label: "Increased tryptophan diet" },
                      { label: "Decreased tryptophan diet" },
                      { label: "Decreased tyramine diet" }
                    ]
                  },
                  {
                    label: "Tyrosine modified diet",
                    children: [
                      { label: "Increased tyrosine diet" },
                      { label: "Decreased tyrosine diet" }
                    ]
                  },
                  {
                    label: "Valine modified diet",
                    children: [
                      { label: "Increased valine diet" },
                      { label: "Decreased valine diet" }
                    ]
                  },
                  {
                    label: "Carbohydrate modified diet",
                    children: [
                      { label: "Consistent carbohydrate diet" },
                      { label: "Increased carbohydrate diet" },
                      { label: "Increased complex carbohydrate diet" },
                      { label: "Increased simple carbohydrate diet" },
                      { label: "Decreased carbohydrate diet" },
                      { label: "Decreased complex carbohydrate diet" },
                      { label: "Decreased simple carbohydrate diet" }
                    ]
                  },
                  {
                    label: "Galactose modified diet",
                    children: [
                      { label: "Increased galactose diet" },
                      { label: "Decreased galactose diet" }
                    ]
                  },
                  {
                    label: "Lactose modified diet",
                    children: [
                      { label: "Increased lactose diet" },
                      { label: "Decreased lactose diet" }
                    ]
                  },
                  {
                    label: "Fructose modified diet",
                    children: [
                      { label: "Increased fructose diet" },
                      { label: "Decreased fructose diet" }
                    ]
                  }
                ]
              },
              { label: "Carbohydrate counting diet—defined as a diet for a client identifying the grams of carbohydrate to consume per meal and per day" },
              {
                label: "Fermentable oligosaccharide, disaccharide, monosaccharide and polyol (FODMAP) modified diet—defined as a diet with a lower or higher amount of fermentable oligo-, di-, monosaccharides and polyols in the diet ",
                children: [
                  { label: "Decreased fermentable oligosaccharide, disaccharide, monosaccharide and polyol (FODMAP) diet—defined as a diet with a reduced amount of fermentable oligo-, di-, monosaccharides and polyol in the diet " },
                  { label: "Fermentable oligosaccharide, disaccharide, monosaccharide and polyol (FODMAP) reintroduction diet—defined as a diet with an overall lower amount of fermentable oligo-, di-, monosaccharides and polyols but with reintroduction of individual FODMAP containing foods to assess tolerance of individual foods" },
                  { label: "Customized low fermentable oligosaccharide, disaccharide, monosaccharide and polyol (FODMAP) diet—defined as a diet with an overall lower amount of fermentable oligo-, di-, monosaccharides and polyols but permits a range of FODMAP containing foods based on the client’s diet tolerance" }
                ]
              },
              {
                label: "Fat modified diet",
                children: [
                  { label: "Increased fat diet" },
                  { label: "Decreased fat diet" },
                  {
                    label: "Monounsaturated fat modified diet",
                    children: [
                      { label: "Increased monounsaturated fat diet" },
                      { label: "Decreased monounsaturated fat diet" }
                    ]
                  },
                  {
                    label: "Polyunsaturated fat modified diet",
                    children: [
                      { label: "Increased polyunsaturated fat diet" },
                      { label: "Increased linoleic acid diet" },
                      { label: "Decreased polyunsaturated fat diet" },
                      { label: "Decreased linoleic acid diet" }
                    ]
                  },
                  {
                    label: "Saturated fat modified diet",
                    children: [
                      { label: "Decreased saturated fat diet" }
                    ]
                  },
                  {
                    label: "Trans fat modified diet",
                    children: [
                      { label: "Decreased trans fat modified diet" }
                    ]
                  },
                  {
                    label: "Omega 3 fatty acid modified diet",
                    children: [
                      { label: "Increased omega 3 fatty acid diet" },
                      { label: "Increased alpha linolenic acid diet" },
                      { label: "Increased eicosapentaenoic acid diet" },
                      { label: "Increased docosahexaenoic acid" },
                      { label: "Decreased omega 3 fatty acid diet" },
                      { label: "Decreased alpha linolenic acid diet" },
                      { label: "Decreased eicosapentaenoic acid diet" },
                      { label: "Decreased docosahexaenoic acid" }
                    ]
                  },
                  {
                    label: "Medium chain triglyceride modified diet",
                    children: [
                      { label: "Increased medium chain triglyceride diet" },
                      { label: "Decreased medium chain triglyceride diet" }
                    ]
                  },
                  {
                    label: "Cholesterol modified diet",
                    children: [
                      { label: "Decreased cholesterol diet" }
                    ]
                  }
                ]
              },
              {
                label: "Fiber modified diet",
                children: [
                  { label: "Increased fiber diet" },
                  { label: "Decreased fiber diet" },
                  {
                    label: "Soluble fiber modified diet",
                    children: [
                      { label: "Increased soluble fiber diet" },
                      { label: "Decreased soluble fiber diet" }
                    ]
                  },
                  {
                    label: "Insoluble fiber modified diet",
                    children: [
                      { label: "Increased insoluble fiber diet" },
                      { label: "Decreased insoluble fiber diet" }
                    ]
                  }
                ]
              },
              {
                label: "Fluid modified diet",
                children: [
                  { label: "Increased fluid diet" },
                  { label: "Fluid restricted diet" },
                  { label: "Clear liquid diet" },
                  { label: "Full liquid diet" }
                ]
              },
              {
                label: "Modification of diets for specific food and/or ingredient",
                children: [
                  { label: "Beef free diet—defined as a diet devoid of beef and beef ingredients" },
                  { label: "Caffeine free diet—defined as a diet devoid of the stimulant caffeine" },
                  { label: "Cow milk free diet—defined as a diet devoid of cow’s milk and cow’s milk ingredients" },
                  { label: "Diet with foods modified to be low in protein" },
                  { label: "Diet modified for egg " },
                  { label: "Raw egg free diet" },
                  { label: "Egg free diet—defined as a diet devoid of egg and egg ingredients" },
                  { label: "Diet modified for uncooked corn starch " },
                  { label: "Fish free diet—defined as a diet devoid of fish and fish ingredients" },
                  { label: "Goat milk free diet—defined as a diet devoid of goat milk and goat milk ingredients" },
                  { label: "Lupin free diet—defined as a diet devoid of lupins and lupin ingredients" },
                  { label: "Mammalian meat free diet—defined as a diet devoid of all mammalian meat and mammalian meat ingredients" },
                  { label: "Mammalian milk free diet—defined as a diet devoid of mammalian milk and mammalian milk ingredients" },
                  { label: "Peanut free diet—defined as a diet devoid of peanuts and peanut ingredients" },
                  { label: "Pork free diet—defined as a diet devoid of pork and pork ingredients" },
                  { label: "Sesame free diet—defined as a diet devoid of sesame and sesame ingredients" },
                  { label: "Sheep milk free diet—defined as a diet devoid of sheep milk and sheep milk ingredients" },
                  { label: "Shellfish free diet—defined as a diet devoid of shellfish and shellfish ingredients" },
                  { label: "Soy free diet—defined as a diet devoid of soy and soy ingredients" },
                  { label: "Tree nut free diet—defined as a diet devoid of tree nuts and tree nut ingredients" },
                  { label: "Wheat free diet" }
                ]
              },
              {
                label: "Vitamin modified diet",
                children: [
                  {
                    label: "Vitamin A modified diet",
                    children: [
                      { label: "Increased vitamin A diet" },
                      { label: "Decreased vitamin A diet" }
                    ]
                  },
                  {
                    label: "Vitamin C modified diet",
                    children: [
                      { label: "Increased vitamin C diet" },
                      { label: "Decreased vitamin C diet" }
                    ]
                  },
                  {
                    label: "Vitamin D modified diet",
                    children: [
                      { label: "Increased vitamin D diet" },
                      { label: "Decreased vitamin D diet" }
                    ]
                  },
                  {
                    label: "Vitamin E modified diet",
                    children: [
                      { label: "Increased vitamin E diet" },
                      { label: "Decreased vitamin E diet" }
                    ]
                  },
                  {
                    label: "Vitamin K modified diet",
                    children: [
                      { label: "Increased vitamin K diet" },
                      { label: "Decreased vitamin K diet" }
                    ]
                  },
                  {
                    label: "Thiamine modified diet",
                    children: [
                      { label: "Increased thiamine diet" },
                      { label: "Decreased thiamine diet" }
                    ]
                  },
                  {
                    label: "Riboflavin modified diet",
                    children: [
                      { label: "Increased riboflavin diet" },
                      { label: "Decreased riboflavin diet" }
                    ]
                  },
                  {
                    label: "Niacin modified diet",
                    children: [
                      { label: "Increased niacin diet" },
                      { label: "Decreased niacin diet" }
                    ]
                  },
                  {
                    label: "Folic acid modified diet",
                    children: [
                      { label: "Increased folic acid diet" },
                      { label: "Decreased folic acid diet" }
                    ]
                  },
                  {
                    label: "Vitamin B6 modified diet",
                    children: [
                      { label: "Increased vitamin B6 diet" },
                      { label: "Decreased vitamin B6 diet" }
                    ]
                  },
                  {
                    label: "Vitamin B12 modified diet",
                    children: [
                      { label: "Increased vitamin B12 diet" },
                      { label: "Decreased vitamin B12 diet" }
                    ]
                  },
                  {
                    label: "Pantothenic acid modified diet",
                    children: [
                      { label: "Increased pantothenic acid diet" },
                      { label: "Decreased pantothenic acid diet" }
                    ]
                  },
                  {
                    label: "Biotin modified diet",
                    children: [
                      { label: "Increased biotin diet" },
                      { label: "Decreased biotin diet" }
                    ]
                  }
                ]
              },
              {
                label: "Mineral modified diet",
                children: [
                  {
                    label: "Calcium modified diet",
                    children: [
                      { label: "Increased calcium diet" },
                      { label: "Decreased calcium diet" }
                    ]
                  },
                  {
                    label: "Chloride modified diet",
                    children: [
                      { label: "Increased chloride diet" },
                      { label: "Decreased chloride diet" }
                    ]
                  },
                  {
                    label: "Iron modified diet",
                    children: [
                      { label: "Increased iron diet" },
                      { label: "Decreased iron diet" }
                    ]
                  },
                  {
                    label: "Magnesium modified diet",
                    children: [
                      { label: "Increased magnesium diet" },
                      { label: "Decreased magnesium diet" }
                    ]
                  },
                  {
                    label: "Potassium modified diet",
                    children: [
                      { label: "Increased potassium diet" },
                      { label: "Decreased potassium diet" }
                    ]
                  },
                  {
                    label: "Phosphorus modified diet",
                    children: [
                      { label: "Increased phosphorus diet" },
                      { label: "Decreased phosphorus diet" }
                    ]
                  },
                  {
                    label: "Sodium modified diet",
                    children: [
                      { label: "Increased sodium diet" },
                      { label: "Decreased sodium diet" }
                    ]
                  },
                  {
                    label: "Zinc modified diet",
                    children: [
                      { label: "Increased zinc diet" },
                      { label: "Decreased zinc diet" }
                    ]
                  },
                  {
                    label: "Sulfur modified diet",
                    children: [
                      { label: "Increased sulfur diet" },
                      { label: "Decreased sulfur diet" }
                    ]
                  },
                  {
                    label: "Copper modified diet",
                    children: [
                      { label: "Increased copper diet" },
                      { label: "Decreased copper diet" }
                    ]
                  },
                  {
                    label: "Iodine modified diet",
                    children: [
                      { label: "Increased iodine diet" },
                      { label: "Decreased iodine diet" }
                    ]
                  },
                  {
                    label: "Selenium modified diet",
                    children: [
                      { label: "Increased selenium diet" },
                      { label: "Decreased selenium diet" }
                    ]
                  },
                  {
                    label: "Manganese modified diet",
                    children: [
                      { label: "Increased manganese diet" },
                      { label: "Decreased manganese diet" }
                    ]
                  },
                  {
                    label: "Chromium modified diet",
                    children: [
                      { label: "Increased chromium diet" },
                      { label: "Decreased chromium diet" }
                    ]
                  },
                  {
                    label: "Molybdenum modified diet",
                    children: [
                      { label: "Increased molybdenum diet" },
                      { label: "Decreased molybdenum diet" }
                    ]
                  },
                  {
                    label: "Boron modified diet",
                    children: [
                      { label: "Increased boron diet" },
                      { label: "Decreased boron diet" }
                    ]
                  },
                  {
                    label: "Cobalt modified diet",
                    children: [
                      { label: "Increased cobalt diet" },
                      { label: "Decreased cobalt diet" }
                    ]
                  }
                ]
              },
              {
                label: "Modification of specific food group",
                children: [
                  { label: "Fruit modified diet" },
                  { label: "Vegetable modified diet" },
                  { label: "Starchy vegetable modified diet" },
                  { label: "Bean and pea modified diet" },
                  { label: "Grain modified diet" },
                  { label: "Protein food modified diet" }
                ]
              },
              {
                label: "Intake Timing",
                children: [
                  { label: "Advance diet as tolerated" },
                  { label: "Nil per os (ie, NPO)" },
                  { label: "Modification of schedule of oral intake (eg, timing of food, number of meals) " },
                  { label: "Modification of schedule of intake to limit fasting" }
                ]
              },
              {
                label: "Other",
                children: [
                  { label: "Decreased oxalate diet—defined as a reduction in the oxalate content of the diet compared to the assessed baseline intake of oxalate " },
                  { label: "Low microbial diet—defined as a diet that is low in organisms (eg, bacteria, viruses, fungi, parasites) because the organisms might pose a health threat" }
                ]
              }
            ]
          }
        ]
      },
      {
        label: "Class: Enteral and Parenteral Nutrition Management",
        children: [
          {
            label: "Enteral and Parenteral Nutrition Management",
            children: [
              {
                label: "Enteral Nutrition Management",
                children: [
                  { label: "Management of composition of enteral nutrition (eg, formula name or description, special additives including supplemental fat, carbohydrate, or protein, fiber)" },
                  { label: "Management of concentration of enteral nutrition (eg, calories/kcal/kJ per mL)" },
                  { label: "Management of rate of enteral nutrition (eg, mL/hour)" },
                  { label: "Management of volume of enteral nutrition (eg, mL/day, mL/feeding)" },
                  { label: "Management of schedule of enteral nutrition (eg, number of hours per 24 hours, continuous, intermittent, bolus)" },
                  { label: "Management of route of enteral nutrition (eg, nasoentric, oroenteric, percutaneous, or surgical access with gastric, duodenal or jejunal placement)" },
                  { label: "Insert enteral feeding tube" },
                  { label: "Management of enteral nutrition site care (eg, change dressings and provide enteral feeding tube site care)" },
                  { label: "Management of flushing of feeding tube (eg, type, volume mL/flush, frequency)" }
                ]
              },
              {
                label: "Parenteral Nutrition/IV Fluids Management",
                children: [
                  { label: "Management of composition of parenteral nutrition (formula or description)" },
                  { label: "Management of concentration of parenteral nutrition (eg, percent, grams of solute per mL)" },
                  { label: "Management of rate of parenteral nutrition (eg, mL/hour)" },
                  { label: "Management of volume of parenteral nutrition" },
                  { label: "Management of schedule of parenteral nutrition (eg, hours, timing, taper schedule)" },
                  { label: "Management of route of parenteral nutrition (eg, peripheral, central, and/or type of catheter)" },
                  { label: "Management of parenteral nutrition site care (eg, change dressings and provide line care for parenteral access)" },
                  { label: "Management of IV fluid delivery (eg, type; amount mL/day, mL/hr, mL with medications)" }
                ]
              }
            ]
          }
        ]
      },
      {
        label: "Class: Nutrition Supplement Therapy",
        children: [
          {
            label: "Nutrition Supplement Therapy",
            children: [
              {
                label: "Medical Food Supplement Therapy",
                children: [
                  { label: "Commercial beverage medical food supplement therapy" },
                  { label: "Commercial food medical food supplement therapy" },
                  { label: "Modified beverage medical food supplement therapy" },
                  { label: "Modified food medical food supplement therapy" },
                  { label: "Purpose of medical food supplement therapy (eg, to supplement energy, protein, carbohydrate, fiber, and/or fat intake)" }
                ]
              },
              {
                label: "Vitamin and Mineral Supplement Therapy",
                children: [
                  { label: "Multivitamin/mineral supplement therapy (yes/no, specify dose, frequency)" },
                  { label: "Multi-trace element supplement therapy (yes/no, specify dose, frequency)" },
                  {
                    label: "Vitamin supplement therapy:",
                    children: [
                      { label: "Vitamin A supplement therapy (specify form, µg or RE, frequency)" },
                      { label: "Vitamin C supplement therapy (mg/ day, frequency)" },
                      { label: "Vitamin D supplement therapy (specify form, µg or IU, frequency)" },
                      { label: "Vitamin E supplement therapy (specify form, mg or IU, frequency)" },
                      { label: "Vitamin K supplement therapy (µg, frequency)" },
                      { label: "Thiamin supplement therapy (mg, frequency)" },
                      { label: "Riboflavin supplement therapy (mg, frequency)  " },
                      { label: "Niacin supplement therapy (specify form, mg, frequency)" },
                      { label: "Folate supplement therapy (specify form, µg, frequency)" },
                      { label: "Vitamin B6 supplement therapy (specify form, mg, frequency)" },
                      { label: "Vitamin B12 supplement therapy (µg, frequency)" },
                      { label: "Pantothenic acid supplement therapy(mg, frequency)" },
                      { label: "Biotin supplement therapy (µg, frequency)" }
                    ]
                  },
                  {
                    label: "Mineral supplement therapy:",
                    children: [
                      { label: "Calcium (specify form, mg, frequency)" },
                      { label: "Chloride supplement therapy (mg, frequency)" },
                      { label: "Iron supplement therapy (specify form, mg, frequency)" },
                      { label: "Magnesium supplement therapy (mg, frequency)" },
                      { label: "Potassium supplement therapy (specify form, g or mg, frequency)" },
                      { label: "Phosphorus supplement therapy  (mg, frequency)" },
                      { label: "Sodium supplement therapy (mg or g, frequency)" },
                      { label: "Zinc supplement therapy (mg, frequency)" },
                      { label: "Sulfate supplement therapy (g or mmol, frequency)    " },
                      { label: "Fluoride supplement therapy (mg, frequency)" },
                      { label: "Copper supplement therapy (µg or mg, frequency)" },
                      { label: "Iodine supplement therapy (µg, frequency)" },
                      { label: "Selenium supplement therapy (specify form, µg, frequency)" },
                      { label: "Manganese supplement therapy (mg, frequency)" },
                      { label: "Chromium supplement therapy (specify form, µg, frequency)" },
                      { label: "Molybdenum supplement therapy (µg, frequency)" },
                      { label: "Boron supplement therapy (mg, frequency)" },
                      { label: "Cobalt supplement therapy (µg, frequency)" }
                    ]
                  }
                ]
              },
              {
                label: "Bioactive Constituent Management",
                children: [
                  { label: "Plant stanol esters management (specify g, form, frequency)" },
                  { label: "Plant sterol esters management  (specify g, form, frequency)" },
                  { label: "Soy protein management  (specify g, form, frequency)" },
                  { label: "Psyllium management (specify g, form, frequency)" },
                  { label: "Beta glucan management (specify g, form, frequency)" },
                  { label: "Food additives management (those thought to have an impact on a client’s health) (specify, eg, amount, form, frequency, pattern)" },
                  { label: "Alcohol management  (specify, oz/mL/units, form, frequency)" },
                  { label: "Caffeine management (specify, eg, mg, oz/mL, form, frequency)" }
                ]
              }
            ]
          }
        ]
      },
      {
        label: "Class: Feeding Assistance Management",
        children: [
          {
            label: "Feeding Assistance Management",
            children: [
              { label: "Adaptive eating device management (equipment or utensils) (eg, specify) " },
              { label: "Feeding position management (eg, specify client position in relationship to eating or degree angle for enteral feeding) " },
              { label: "Meal set up management (eg, specify actions to make food accessible for consumption)" },
              { label: "Mouth care management (eg specify treatment to promote oral health and hygiene) " },
              { label: "Menu selection assistance (yes/no) " },
              { label: "Other (specify)" }
            ]
          }
        ]
      },
      {
        label: "Class: Manage Feeding Environment",
        children: [
          {
            label: "Manage Feeding Environment",
            children: [
              { label: "Feeding environment lighting management (eg, specify)" },
              { label: "Feeding environment odors management (eg, specify, minimize or enhance)" },
              { label: "Feeding environment distractions management (eg, specify, minimize)" },
              { label: "Feeding environment table height management (specify)" },
              { label: "Feeding environment table service management (eg, plates, napkins)" },
              { label: "Feeding environment room temperature management" },
              { label: "Feeding environment meal service management (type of service, eg, service at table, buffet)" },
              { label: "Feeding environment meal location management (specify)" }
            ]
          }
        ]
      },
      {
        label: "Class: Nutrition Related Medication Management",
        children: [
          {
            label: "Nutrition Related Medication Management",
            children: [
              { label: "Management of nutrition related prescription medication (eg, insulin, appetite stimulants, digestive enzymes) dose, form, schedule, route" },
              { label: "Management of nutrition related over the counter (OTC) medication (eg, antacids, aspirin, laxatives) dose, form, schedule, route" },
              { label: "Management of nutrition related complementary and alternative medicine (eg, peppermint oil, probiotics), dose, form, schedule, route" }
            ]
          }
        ]
      },
      {
        label: "Class: Infant Feeding Management",
        children: [
          {
            label: "Infant Feeding Management",
            children: [
              {
                label: "Breastmilk* feeding management",
                children: [
                  { label: "Management of concentration of breastmilk* (calories/kcal/kJ per ounce)— defined as actions to alter the energy density of expressed or donor human milk through additives " },
                  { label: "Management of human milk fortifier additive in breastmilk* (g/day and mL/day)— defined as actions to alter the quantity of human milk" },
                  { label: "Management of carbohydrate additive in breastmilk* (g/day)— defined as actions to alter the quantity of carbohydrate that is added to human milk" },
                  { label: "Management of fat additive in breastmilk* (mL/day)—defined as actions to alter the quantity of fat that is added to human milk" },
                  { label: "Management of protein additive in breastmilk* (g/day and mL/day)— defined as actions to alter the quantity of protein that is added to human milk" },
                  { label: "Management of fiber additive in breastmilk* (g/day and mL/day)— defined as actions to alter the quantity of fiber that is added to human milk" },
                  { label: "Management of added infant formula in breastmilk* (g/day and mL/day)—defined as actions to alter the quantity of infant formula that is added to human milk" },
                  { label: "Management of breastfeeding attempts (number per day)—defined as actions taken to alter the number of breastfeeding attempts in one day" },
                  { label: "Management of volume of breastmilk+ (eg, in bottle or other route of feeding) (mL/feeding)—defined as actions to alter the volume of human milk provided in each feeding" },
                  { label: "Evaluation of breastfeeding+ plan— defined as actions to appraise the parent’s approach to support infant nourishment via human milk" },
                  { label: "Evaluation of breastfeeding— defined as actions to appraise the parent’s breastfeeding of the infant" },
                  { label: "Evaluation of breastfeeding+ behavior—defined as actions to appraise the behavior of parent  and infant while breastfeeding" },
                  { label: "Promotion of exclusive breastfeeding+—defined as actions to encourage nourishment of an infant via breastfeeding for the first 6 months of life while permitting oral vitamin and mineral supplements and medicines" },
                  { label: "Promotion of predominant breastfeeding—defined as actions to encourage nourishment of an infant primarily from human milk, including expressed or donor milk, while permitting other liquids, oral vitamin and mineral supplements and medicines" },
                  { label: "Promotion of partial breastfeeding+—defined as actions to encourage nourishment of an infant partially from human milk, including expressed or donor milk, with nourishment from other sources" }
                ]
              },
              {
                label: "Infant formula management ",
                children: [
                  { label: "Management of composition of infant formula (formula name or description)—defined as actions to alter the infant formula provided" },
                  { label: "Management of concentration of infant formula (calories/kcal/kJ per ounce)—defined as actions to alter the energy density of infant formula through additives" },
                  { label: "Management of human milk fortifier additive in infant formula (g/day and mL/day)—defined as actions to alter the quantity of human milk fortifier that is added to infant formula" },
                  { label: "Management of carbohydrate additive in infant formula (g/day)—defined as actions to alter the quantity of carbohydrate that is added to infant formula" },
                  { label: "Management of fat additive in infant formula (mL/day)—defined as actions to alter the quantity of fat that is added to infant formula" },
                  { label: "Management of protein additive in infant formula (g/day and mL/day)—defined as actions to alter the quantity of protein that is added to infant formula" },
                  { label: "Management of fiber additive in infant formula (g/day and mL/day)—defined as actions to alter the quantity of fiber that is added to infant formula" },
                  { label: "Management of infant formula feeding attempts (number per day)—defined as actions taken to alter the number of infant formula feeding attempts in one day" },
                  { label: "Management of volume of infant formula (mL/feeding)—defined as actions to alter the volume of infant formula provided in each feeding" },
                  { label: "Evaluation of infant formula feeding plan—defined as actions to appraise the parent’s approach to support infant nourishment via infant formula" },
                  { label: "Evaluation of infant formula feeding—defined as actions to appraise the parent’s infant formula feeding of the infant" },
                  { label: "Evaluation of infant formula feeding behavior—defined as actions to appraise the behavior of parent and infant while feeding with infant formula" }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    label: "Nutrition Education (E)",
    children: [
      {
        label: "Class: Nutrition Education Content (1)",
        children: [
          { label: "Content related nutrition education—defined as instruction intended to lead to nutrition-related knowledge" },
          { label: "Education on nutrition's influence on health—defined as instruction intended to lead to knowledge about the association between nutrition and health and disease status" },
          { label: "Physical activity guidance—defined as instruction intended to lead to physical activity-related knowledge and change " }
        ]
      },
      {
        label: "Class: Nutrition Education Application (2)",
        children: [
          { label: "Nutrition related laboratory result interpretation education—defined as instruction or training leading to nutrition-related laboratory result interpretation (eg, medical or other results to coincide with nutrition plan, such as such as, distribution of carbohydrates throughout the day based on blood glucose monitoring results)" },
          { label: "Nutrition related skill education—defined as instruction or training leading to nutrition-related skill development (eg, numeracy, glucometer use, home enteral nutrition feeding tube and feeding pump training, cooking and food preparation, physical activity equipment use)" },
          { label: "Technical nutrition education—defined as instruction or training leading to nutrition-related result interpretation or skills (eg, ability to evaluate stool output from ostomy, heart rate during physical activity)" }
        ]
      }
    ]
  },
  {
    label: "Nutrition Counseling (C)",
    children: [
      {
        label: "Nutrition Counseling Theoretical Basis/Approach (1)",
        children: [
          { label: "Nutrition counseling based on cognitive behavioral theory approach" },
          { label: "Nutrition counseling based on health belief model" },
          { label: "Nutrition counseling based on social learning theory approach" },
          { label: "Nutrition counseling based on transtheoretical model and stages of change approach" }
        ]
      },
      {
        label: "Nutrition Counseling Strategies (2)",
        children: [
          { label: "Nutrition counseling based on motivational interviewing strategy" },
          { label: "Nutrition counseling based on goal setting strategy" },
          { label: "Nutrition counseling based on self monitoring strategy" },
          { label: "Nutrition counseling based on problem solving strategy" },
          { label: "Nutrition counseling based on social support strategy" },
          { label: "Nutrition counseling based on stress management strategy" },
          { label: "Nutrition counseling based on stimulus control strategy" },
          { label: "Nutrition counseling based on cognitive restructuring strategy" },
          { label: "Nutrition counseling based on relapse prevention strategy" },
          { label: "Nutrition counseling based on rewards and contingency management strategy" }
        ]
      }
    ]
  },
  {
    label: "Coordination of Nutrition Care by a Nutrition Professional (RC)",
    children: [
      {
        label: "Class: Collaboration and Referral of Nutrition Care (1)",
        children: [
          { label: "Team meeting involving nutrition professional (Holding a team meeting to develop a comprehensive plan of care)" },
          { label: "Referral by nutrition professional to another nutrition professional with different expertise (A referral for care by other nutrition and dietetics practitioners who provide different expertise)" },
          { label: "Collaboration by nutrition professional with other nutrition professionals (Collaboration by nutrition and dietetics practitioner with other nutrition and dietetics practitioners)" },
          { label: "Collaboration by nutrition professional with other providers (Collaboration with others such as the physician, dentist, physical therapist, social worker, occupational therapist, speech therapist, nurse, pharmacist, or other specialist dietitian)" },
          { label: "Referral by nutrition professional to other provider (Refer to others such as the physician, dentist, physical therapist, social worker, occupational therapist, speech therapist, nurse, pharmacist, or other specialist nutrition and dietetics practitioner)" },
          { label: "Referral by nutrition professional to community agencies and programs (Refer to an appropriate agency/program (eg, home delivered meals), assistance programs for women, infants and children [eg, WIC], food assistance programs [eg, food pantry, soup kitchen, food stamps],  housing assistance, shelters, rehabilitation, physical and mental disability programs, education training, and employment programs)" }
        ]
      },
      {
        label: "Class: Discharge and Transfer of Nutrition Care to a New Setting or Provider (2)",
        children: [
          { label: "Discharge and transfer of nutrition care to other providers: Refer to others such as the physician, dentist, physical therapist, social worker, occupational therapist, speech therapist, nurse, or pharmacist" },
          { label: "Discharge and transfer of nutrition care to community agencies and programs: Refer to a community agency/program (eg, home delivered meals, assistance programs for women, infants and children [eg, WIC], food assistance programs [eg, food pantry, soup kitchen, food stamps], housing assistance, shelters, rehabilitation, physical and mental disability programs, education, training and employment programs)" },
          { label: "Discharge and transfer of nutrition care from nutrition professional to another nutrition professional: Transfer of nutrition care to another nutrition and dietetics practitioner" }
        ]
      }
    ]
  }
];
